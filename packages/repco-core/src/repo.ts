import * as ucans from '@ucans/ucans'
import * as common from 'repco-common/zod'
import { CID } from 'multiformats/cid.js'
import { EventEmitter } from 'node:events'
import { createLogger, Logger } from 'repco-common'
import {
  CommitBundle,
  CommitHeaders,
  RevisionBundle,
} from 'repco-common/schema'
import {
  Prisma,
  PrismaClient,
  repco,
  Repo as RepoRecord,
  Revision,
} from 'repco-prisma'
import { fetch } from 'undici'
import { ZodError } from 'zod'
import { DataSource, DataSourceRegistry } from './datasource.js'
import { plugins as defaultDataSourcePlugins } from './datasources/defaults.js'
import {
  entityForm,
  EntityInputWithHeaders,
  EntityInputWithRevision,
  EntityMaybeContent,
  HeadersForm,
  headersForm,
  UnknownEntityInput,
} from './entity.js'
import {
  createRepoKeypair,
  getInstanceKeypair,
  getPublishingUcanForInstance,
} from './repo/auth-instance.js'
import {
  IpldBlockStore,
  LevelIpldBlockStore,
  PrismaIpldBlockStore,
} from './repo/blockstore.js'
import {
  ExportOnProgressCallback,
  exportRepoToCar,
  exportRepoToCarReversed,
} from './repo/export.js'
import { importRepoFromCar, OnProgressCallback } from './repo/import.js'
import { IpldRepo } from './repo/ipld-repo.js'
import { RelationFinder } from './repo/relation-finder.js'
import {
  ContentLoaderStream,
  RevisionFilter,
  RevisionStream,
} from './repo/stream.js'
import { ParseError } from './util/error.js'
import { createEntityId } from './util/id.js'
import { notEmpty } from './util/misc.js'
import { Mutex } from './util/mutex.js'

// export * from './repo/types.js'

export type SaveBatchOpts = {
  commitEmpty: boolean
}

export const SAVE_BATCH_DEFAULTS = {
  commitEmpty: false,
}

export type RevisionWithoutCid = Omit<Revision, 'revisionCid'>

export enum ErrorCode {
  NOT_FOUND = 'NOT_FOUND',
  INVALID = 'INVALID',
}

export class RepoError extends Error {
  constructor(public code: ErrorCode, message: string) {
    super(message)
  }
  static is(obj: unknown): obj is RepoError {
    return obj instanceof RepoError
  }
}

export type OpenParams = {
  did?: string
  name?: string
}

const log = createLogger('repo')

function defaultBlockStore(
  prisma: PrismaClient | Prisma.TransactionClient,
): IpldBlockStore {
  if (process.env.LEVEL_BLOCK_STORE) {
    return new LevelIpldBlockStore(process.env.LEVEL_BLOCK_STORE)
  }
  return new PrismaIpldBlockStore(prisma)
}

class RepoRegistry extends EventEmitter {
  repos: Map<string, Repo> = new Map()
  opening: Map<string, Promise<void>> = new Map()

  public async open(
    prisma: PrismaClient,
    didOrName: string,
    useCache = true,
  ): Promise<Repo> {
    const did = await this.nameToDid(prisma, didOrName)
    if (useCache) {
      if (!this.repos.has(did)) {
        if (!this.opening.has(did)) {
          await this._openInner(prisma, did)
        } else {
          await this.opening.get(did)
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return this.repos.get(did)!
    } else {
      const did = await this.nameToDid(prisma, didOrName)
      return this.load(prisma, did)
    }
  }

  async _openInner(prisma: PrismaClient, did: string) {
    let _resolve: (v: void | PromiseLike<void>) => void
    let _reject: (e: any) => void
    const promise = new Promise<void>((resolve, reject) => {
      _resolve = resolve
      _reject = reject
    })
    this.opening.set(did, promise)
    try {
      const repo = await this.load(prisma, did)
      this.repos.set(did, repo)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      _resolve!()
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      _reject!(err)
    } finally {
      this.opening.delete(did)
    }
  }

  async createOrOpen(prisma: PrismaClient, name: string, did?: string) {
    try {
      return await this.open(prisma, did || name)
    } catch (_err) {
      return await this.create(prisma, name)
    }
  }

  async openWithDefaults(nameOrDid?: string) {
    const prisma = new PrismaClient()
    if (!nameOrDid) nameOrDid = process.env.REPCO_REPO || 'default'
    return this.open(prisma, nameOrDid)
  }

  async create(
    prisma: PrismaClient,
    name: string,
    did?: string,
    useCache = true,
  ) {
    if (!name.match(/[a-zA-Z0-9-]{3,64}/)) {
      throw new Error(
        'Repo name is invalid. Repo names must be between 3 and 64 alphanumerical characters',
      )
    }
    // DID specified: Validate the DID type.
    // TODO: Check if the check via verifyIssuerAlg is enough.
    if (did) {
      const supportedAlgs = ['EdDSA', 'ES256', 'RS256']
      let valid = false
      for (const alg of supportedAlgs) {
        valid = valid || ucans.defaults.verifyIssuerAlg(did, alg)
      }
      if (!valid) throw new Error('DID is invalid or unsupported.')
    }
    // No DID specified: Create new keypair.
    if (!did) {
      const keypair = await createRepoKeypair(prisma)
      did = keypair.did()
    }
    // Create repo.
    await prisma.repo.create({
      data: {
        did,
        name,
      },
    })
    const repo = await this.open(prisma, did, useCache)
    this.emit('create', repo)
    if (repo.writeable) {
      await repo.saveBatch([], { commitEmpty: true })
    }
    return repo
  }

  async nameToDid(prisma: PrismaClient, name: string): Promise<string> {
    if (name.startsWith('did:')) return name
    const record = await prisma.repo.findFirst({
      where: { name },
      select: { did: true },
    })
    if (!record) {
      throw new RepoError(ErrorCode.NOT_FOUND, `Repo not found`)
    }
    return record.did
  }

  async load(prisma: PrismaClient, did: string): Promise<Repo> {
    const record = await prisma.repo.findFirst({
      where: { did },
    })
    if (!record) {
      throw new RepoError(ErrorCode.NOT_FOUND, `Repo not found`)
    }
    const cap = await getPublishingUcanForInstance(prisma, did).catch(
      (_) => null,
    )
    const repo = new Repo(prisma, record, cap)
    return repo
  }

  async list(prisma: PrismaClient): Promise<RepoRecord[]> {
    const list = await prisma.repo.findMany()
    return list
  }

  async all(prisma: PrismaClient): Promise<Repo[]> {
    const list = await this.list(prisma)
    const repos = await Promise.all(
      list.map(({ did }) => this.open(prisma, did)),
    )
    return repos
  }

  async mapAsync<T = void>(
    prisma: PrismaClient,
    mapAsync: (repo: Repo) => Promise<T>,
  ) {
    const repos = await this.all(prisma)
    const tasks = repos.map(mapAsync)
    const results = await Promise.all(tasks)
    return results
  }
}

export const repoRegistry = new RepoRegistry()

export class Repo extends EventEmitter {
  public dsr: DataSourceRegistry
  public blockstore: IpldBlockStore
  public prisma: PrismaClient | Prisma.TransactionClient
  public ipld: IpldRepo

  public record: RepoRecord

  private publishingCapability: string | null
  private validatedAgents: Set<string> = new Set()

  private txlock = new Mutex()

  public log: Logger

  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    record: RepoRecord,
    cap: string | null,
    dsr?: DataSourceRegistry,
    bs?: IpldBlockStore,
  ) {
    super()
    this.record = record
    this.prisma = prisma
    this.dsr = dsr || new DataSourceRegistry()
    this.blockstore = bs || defaultBlockStore(prisma)
    this.publishingCapability = cap
    this.ipld = new IpldRepo(record.did, this.blockstore)
    this.log = log.child({ repo: this.did })
  }

  private async $transaction<R>(fn: (repo: Repo) => Promise<R>) {
    assertFullClient(this.prisma)
    return await this.prisma.$transaction(async (tx) => {
      const self = new Repo(
        tx,
        this.record,
        this.publishingCapability,
        this.dsr,
        this.blockstore,
      )
      const res = await fn(self)
      this.emit('update')
      return res
    })
  }

  get name() {
    return this.record.name
  }

  get did() {
    return this.record.did
  }

  get writeable() {
    return !!this.publishingCapability
  }

  async addDataSource(pluginUid: string, config: any) {
    return await this.dsr.create(
      this.prisma,
      defaultDataSourcePlugins,
      pluginUid,
      config,
      this.did,
    )
  }

  async refreshInfo() {
    const record = await this.prisma.repo.findUnique({
      where: { did: this.did },
    })
    if (!record) {
      throw new RepoError(ErrorCode.NOT_FOUND, `Repo not found`)
    }
    this.record = record
  }

  get gateways() {
    return this.record.gateways
  }

  async setGateways(gateways: string[]) {
    await this.prisma.repo.update({
      where: { did: this.did },
      data: { gateways },
    })
    await this.refreshInfo()
  }

  async hasRoot(rootCid: CID | string): Promise<boolean> {
    const cidStr = rootCid.toString()
    return !!(await this.prisma.commit.count({
      where: { rootCid: cidStr, repoDid: this.did },
    }))
  }

  async pullFromGateways() {
    if (this.writeable) throw new Error('Cannot pull-sync writeable repo')
    for (const gateway of this.gateways) {
      const log = this.log.child({ gateway })
      const maybeHead = await this.getHeadMaybe()
      const ownHead = maybeHead ? maybeHead.toString() : ''
      log.debug({ msg: `sync: start`, ownHead, gateway })
      const url = `${gateway}/api/sync/${this.did}`
      const res = await fetch(url, { method: 'HEAD' })
      const theirHead = res.headers.get('x-repco-head')
      if (theirHead && !(await this.hasRoot(theirHead))) {
        log.debug({
          msg: `sync: retrieved head, now fetching updates`,
          theirHead,
        })
        const res = await fetch(url + `/${ownHead}`)
        log.debug(`sync: got response ${res.status}, start import`)
        if (!res.body) continue
        await this.importFromCar(res.body, (progress) =>
          log.debug({ msg: 'sync: progress', progress }),
        )
        log.debug({ msg: `sync: finished import` })
      } else {
        log.debug({
          msg: `sync: retrieved head, no pending updates`,
          theirHead,
        })
      }
    }
  }

  registerDataSource(ds: DataSource) {
    this.dsr.register(ds)
  }

  createRevisionStream(filter: RevisionFilter = {}) {
    return new RevisionStream(this, false, filter)
  }

  createRevisionBatchStream(filter: RevisionFilter = {}) {
    return new RevisionStream(this, true, filter)
  }

  createContentStream(
    filter: RevisionFilter = {},
  ): AsyncGenerator<EntityInputWithRevision> {
    return ContentLoaderStream(this.createRevisionStream(filter), false)
  }

  createContentBatchStream(
    filter: RevisionFilter,
  ): AsyncGenerator<EntityInputWithRevision[]> {
    return ContentLoaderStream(this.createRevisionBatchStream(filter), true)
  }

  async fetchRevisionsWithContent(
    filter: RevisionFilter = {},
  ): Promise<EntityInputWithRevision[]> {
    const where: Prisma.RevisionWhereInput = {
      repoDid: this.did,
    }
    if (filter.from) {
      where.id = { gt: filter.from }
    }
    if (filter.type) {
      where.entityType = { in: filter.type }
    }
    const revisions = await this.prisma.revision.findMany({
      where,
      take: filter.limit,
    })
    return Promise.all(revisions.map((r) => this.maybeResolveContent(r, true)))
  }

  async getCursor(): Promise<string | undefined> {
    const row = await this.prisma.revision.findFirst({
      where: { repoDid: this.did },
      orderBy: { id: 'desc' },
      select: { id: true },
    })
    if (!row) return undefined
    return row.id
  }

  async getTail(): Promise<common.CID | null> {
    const row = await this.prisma.repo.findUnique({
      where: { did: this.did },
      select: { tail: true },
    })
    if (!row || !row.tail) return null
    return common.parseCid(row.tail)
  }

  async getHead(): Promise<common.CID> {
    const head = await this.getHeadMaybe()
    if (!head) throw new Error('Repo is empty')
    return head
  }

  async getHeadMaybe(): Promise<common.CID | null> {
    const row = await this.prisma.repo.findUnique({
      where: { did: this.did },
      select: { head: true },
    })
    if (!row || !row.head) return null
    return common.parseCid(row.head)
  }

  async saveEntity(
    input: any,
    headers: any = {},
  ): Promise<EntityInputWithRevision | null> {
    const data = { ...input, ...headers }
    const res = await this.saveBatch([data])
    if (!res) return null
    return res[0]
  }

  async exportToCar(opts: { tail?: CID } = {}) {
    const head = await this.getHead()
    if (!head) throw new Error('Cannot export empty repo.')
    return exportRepoToCar(this.blockstore, head, opts.tail)
  }

  async exportToCarReversed(
    opts: {
      tail?: CID
      head?: CID
      onProgress?: ExportOnProgressCallback
    } = {},
  ) {
    const head = opts.head || (await this.getHead()) || undefined
    if (!head) throw new Error('Cannot export empty repo.')
    return exportRepoToCarReversed(this, head, opts.tail, opts.onProgress)
  }

  async importFromCar(
    stream: AsyncIterable<Uint8Array>,
    onProgress?: OnProgressCallback,
  ) {
    return importRepoFromCar(this, stream, onProgress)
  }

  async saveBatch(
    inputs: UnknownEntityInput[],
    opts: Partial<SaveBatchOpts> = {},
  ) {
    if (!this.writeable) throw new Error('Repo is not writeable')
    const fullOpts: SaveBatchOpts = { ...SAVE_BATCH_DEFAULTS, ...opts }

    // Save the batch in one transaction.
    const release = await this.txlock.lock()

    try {
      // Parse all entities
      const parsedInputs = parseEntities(inputs)
      // Assign UIDs to all entities
      const entityForms = await this.assignUids(parsedInputs)

      // Resolve missing relations.
      const entities = await RelationFinder.resolve(this, entityForms)

      // Abort early if there's nothing to save.
      if (!fullOpts.commitEmpty && !entities.length) return null

      // Create the actual commit as a single prisma transaction
      // TODO: The transaction can get very big and times out.
      // Therefore the Prisma transaction is removed for now.
      // We still have the repo-wide txlock.
      // return await this.$transaction((repo) =>
      return this.saveBatchInner(entities, fullOpts)
      // )
    } finally {
      release()
    }
  }

  private async saveBatchInner(
    entities: EntityInputWithHeaders[],
    opts: SaveBatchOpts,
  ) {
    if (!this.publishingCapability) throw new Error('Repo is not writable')
    const agentKeypair = await getInstanceKeypair(this.prisma)
    const parent = await this.getHeadMaybe()
    const bundle = await this.ipld.createCommit(
      entities,
      agentKeypair,
      this.publishingCapability,
      opts,
      parent,
    )
    if (!bundle) return null
    const counts = bundle.body.reduce<Record<string, number>>((agg, r) => {
      const key = r.headers.EntityType
      if (!agg[key]) agg[key] = 0
      agg[key] += 1
      return agg
    }, {})
    const details = {
      entities: counts,
      revisions: bundle.body.length,
      root: bundle.headers.Cid,
    }
    this.log.debug({ msg: 'Created commit', details })
    const ret = await this.saveFromIpld(bundle)
    return ret
  }

  async saveFromIpld(bundle: CommitBundle) {
    const { headers, body } = bundle
    await this.ensureAgent(headers.Author)
    assertFullClient(this.prisma)
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. create revisions
        const revisionsDb = body.map((revision) =>
          revisionIpldToDb(revision, headers),
        )
        await tx.revision.createMany({
          data: revisionsDb,
        })

        // 2. update Entity table
        const deleteEntities = revisionsDb
          .filter((r) => r.prevRevisionId)
          .map((r) => r.uid)
        await tx.entity.deleteMany({
          where: { uid: { in: deleteEntities } },
        })
        const entityUpsert = revisionsDb.map((revision) => ({
          uid: revision.uid,
          revisionId: revision.id,
          type: revision.entityType,
        }))
        await tx.entity.createMany({
          data: entityUpsert,
        })

        // 3. upsert entity tables
        const data = body.map(
          (revisionBundle, i) => [revisionBundle, revisionsDb[i]] as const,
        )
        const ret = []
        for (const [revisionBundle, revisionDb] of data) {
          const input = repco.parseEntity(
            revisionBundle.headers.EntityType,
            revisionBundle.body,
          )
          const data = {
            ...input,
            revision: revisionDb,
            uid: revisionBundle.headers.EntityUid,
          }
          await repco.upsertEntity(
            tx,
            data.revision.uid,
            data.revision.id,
            data,
          )
          ret.push(data)
        }

        // 4. create commit
        let parent = null
        if (headers.Parents?.length && headers.Parents[0]) {
          parent = headers.Parents[0].toString()
        }
        await tx.commit.create({
          data: {
            rootCid: headers.RootCid.toString(),
            commitCid: headers.Cid.toString(),
            repoDid: headers.Repo,
            agentDid: headers.Author,
            parent,
            timestamp: headers.DateCreated,
            Revisions: {
              connect: body.map((revisionBundle) => ({
                revisionCid: revisionBundle.headers.Cid.toString(),
              })),
            },
          },
        })

        // 5. update repo head
        const head = headers.RootCid.toString()
        const tail = parent ? undefined : head
        await tx.repo.update({
          where: { did: this.did },
          data: { head, tail },
        })

        return ret
      },
      {
        maxWait: 5000,
        timeout: 10000,
      },
    )
  }

  async assignUids(
    input: EntityFormWithHeaders[],
  ): Promise<EntityInputWithHeaders[]> {
    const entityUris = new Set(
      input.map((input) => input.headers.EntityUris || []).flat(),
    )
    const entityUids = new Set(
      input.map((input) => input.entity.content.uid).filter(notEmpty),
    )
    const uidsForUris = await this.prisma.revision.groupBy({
      where: { entityUris: { hasSome: Array.from(entityUris) } },
      by: ['uid'],
    })
    uidsForUris.forEach((row) => entityUids.add(row.uid))
    const prevEntitiesWithRevisions = await this.prisma.entity.findMany({
      where: { uid: { in: Array.from(entityUids) } },
      include: {
        Revision: {
          select: {
            id: true,
            uid: true,
            entityUris: true,
            entityType: true,
            dateCreated: true,
            contentCid: true,
          },
        },
      },
    })
    const prevRevisions = prevEntitiesWithRevisions.map((e) => e.Revision)
    const prevRevisionsByKey = prevRevisions.reduce<
      Record<string, (typeof prevRevisions)[number]>
    >((agg, r) => {
      agg[r.uid] = r
      r.entityUris.forEach((u) => (agg[u] = r))
      return agg
    }, {})

    const res = []
    for (const { entity, headers } of input) {
      let uid = entity.content.uid
      const keys = [uid, ...(headers.EntityUris || [])].filter(notEmpty)
      const prevRevision = keys
        .map((key) => prevRevisionsByKey[key])
        .filter(notEmpty)[0]
      let prevContentCid
      if (prevRevision) {
        if (prevRevision.entityType !== entity.type) {
          throw new Error(
            `Type mismatch for ${uid}: Previous revision has type ${prevRevision.entityType} and input has type ${entity.type}`,
          )
        }
        if (uid && uid !== prevRevision.uid) {
          throw new Error(
            `Uid mismatch: Previous revision has uid ${prevRevision.uid} and input has uid ${entity.content.uid}`,
          )
        }

        headers.DateCreated = prevRevision.dateCreated
        headers.ParentRevision = prevRevision.id
        uid = prevRevision.uid
        prevContentCid = prevRevision.contentCid
      } else {
        headers.ParentRevision = null
        uid = createEntityId()
      }

      setUid(entity, uid)
      res.push({ ...entity, headers, prevContentCid })
    }
    return res
  }

  private async ensureAgent(did: string) {
    if (!this.validatedAgents.has(did)) {
      const res = await this.prisma.agent.findFirst({ where: { did } })
      if (!res) {
        await this.prisma.agent.create({ data: { did } })
      }
      this.validatedAgents.add(did)
    }
  }

  async getUnique<T extends boolean>(
    where: Prisma.RevisionWhereUniqueInput,
    includeContent: T,
  ): Promise<EntityMaybeContent<T> | null> {
    // const include = includeContent ? { ContentBlock: true } : null
    const revision = await this.prisma.revision.findUnique({
      where,
      // include,
    })
    if (!revision) return null
    return this.maybeResolveContent(revision, includeContent)
  }

  async getFirst<T extends boolean>(
    where: Prisma.RevisionWhereInput,
    includeContent: T,
  ): Promise<EntityMaybeContent<T> | null> {
    // const include = includeContent ? { ContentBlock: true } : null
    const revision = await this.prisma.revision.findFirst({
      where,
      // include,
    })
    if (!revision) return null
    return this.maybeResolveContent(revision, includeContent)
  }

  async maybeResolveContent<T extends boolean>(
    revision: Revision,
    includeContent: T,
  ): Promise<EntityMaybeContent<T>> {
    if (includeContent) {
      return (await this.resolveContent(revision)) as EntityMaybeContent<T>
    } else {
      return {
        type: revision.entityType as EntityInputWithRevision['type'],
        revision,
      } as EntityMaybeContent<T>
    }
  }

  async resolveContent(revision: Revision): Promise<EntityInputWithRevision> {
    try {
      const rawContent = await this.blockstore.get(
        common.parseCid(revision.contentCid),
      )
      const entity = repco.parseEntity(revision.entityType, rawContent)
      setUid(entity, revision.uid)
      return {
        ...entity,
        revision,
      }
    } catch (err) {
      console.error('resolveContent err', err)
      throw err
    }
  }
}

export class RelationNotFoundError extends Error {
  constructor(public value: string, public relation: common.Relation) {
    super(
      `Related entity not found: ${value} on ${relation.type}:${relation.field}`,
    )
  }
}

function setUid(
  input: repco.EntityInput,
  uid: string,
): asserts input is repco.EntityInputWithUid {
  ;(input as any).uid = uid
  input.content.uid = uid
}

function assertFullClient(
  prisma: PrismaClient | Prisma.TransactionClient,
): asserts prisma is PrismaClient {
  // @ts-ignore
  if (prisma.$transaction === undefined) {
    throw new Error('Transaction may not be nested.')
  }
}

type EntityFormWithHeaders = {
  entity: repco.EntityInput
  headers: HeadersForm
}

function parseEntity(input: UnknownEntityInput): EntityFormWithHeaders {
  try {
    const headers = headersForm.parse(input.headers || {})
    const parsed = entityForm.parse(input)
    const entity = repco.parseEntity(parsed.type, parsed.content)
    return { entity, headers }
  } catch (err) {
    if (err instanceof ZodError) {
      console.log(input.content, input.headers, input.type)
      throw new ParseError(err, (input as any).type)
    } else {
      throw err
    }
  }
}

export function parseEntities(
  inputs: UnknownEntityInput[],
): EntityFormWithHeaders[] {
  return inputs.map(parseEntity)
}

export function revisionIpldToDb(
  input: RevisionBundle,
  commitHeaders: CommitHeaders,
): Revision {
  const { headers } = input
  let prevRevisionId = null
  if (headers.ParentRevision) {
    prevRevisionId = headers.ParentRevision
  }
  return {
    id: input.headers.RevisionUid,
    prevRevisionId,
    uid: headers.EntityUid,
    repoDid: commitHeaders.Repo,
    agentDid: commitHeaders.Author,
    entityType: headers.EntityType,
    dateModified: headers.DateModified,
    dateCreated: headers.DateCreated || headers.DateModified,
    isDeleted: headers.Deleted || false,
    entityUris: headers.EntityUris,
    revisionUris: headers.RevisionUris,
    contentCid: headers.BodyCid.toString(),
    revisionCid: headers.Cid.toString(),
    derivedFromUid: headers.DerivedFrom || null,
    languages: '',
  }
}
