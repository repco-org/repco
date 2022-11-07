import * as ucans from '@ucans/ucans'
import * as common from 'repco-common/zod'
import { CID } from 'multiformats/cid.js'
import {
  Prisma,
  PrismaClient,
  repco,
  Repo as RepoRecord,
  Revision,
} from 'repco-prisma'
import { DataSource, DataSourceRegistry } from './datasource.js'
import {
  EntityInputWithHeaders,
  EntityMaybeContent,
  FullEntity,
} from './entity.js'
import { Authority } from './repo/auth.js'
import { IpldBlockStore, PrismaIpldBlockStore } from './repo/blockstore.js'
import { exportRepoToCar, exportRepoToCarReversed } from './repo/export.js'
import { GGraph } from './repo/graph.js'
import { importRepoFromCar } from './repo/import.js'
import { RevisionFilter, RevisionStream } from './repo/stream.js'
import {
  CommitBundle,
  CommitIpld,
  entityForm,
  headersForm,
  RevisionIpld,
  revisionIpldToDb,
  RootIpld,
} from './repo/types.js'
import { MapList } from './util/collections.js'
import { createEntityId, createRevisionId } from './util/id.js'

export * from './repo/types.js'

// const REPOS: Map<string, Repo> = new Map()

export type RevisionWithoutCid = Omit<Revision, 'revisionCid'>
export type RevisionWithUnknownContent = {
  content: unknown
  revision: RevisionIpld
  revisionCid: CID
}

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

const REVISION_SELECT = {
  id: true,
  entityType: true,
  dateCreated: true,
  uid: true,
}

export class Repo {
  public dsr: DataSourceRegistry
  public blockstore: IpldBlockStore
  public prisma: PrismaClient | Prisma.TransactionClient

  public readonly record: RepoRecord

  private authority: Authority
  private validatedAgents: Set<string> = new Set()

  public static CACHE: Map<string, Repo> = new Map()
  public static cache = true

  static async createOrOpen(prisma: PrismaClient, name: string, did?: string) {
    try {
      return await Repo.open(prisma, did || name)
    } catch (_err) {
      return await Repo.create(prisma, name)
    }
  }

  static async create(prisma: PrismaClient, name: string, did?: string) {
    // No did specified: Create new keypair.
    if (!did) {
      const keypair = await ucans.EdKeypair.create({ exportable: true })
      did = keypair.did()
      await prisma.keypair.create({
        data: {
          did,
          secret: await keypair.export(),
        },
      })
    }
    // Create repo.
    await prisma.repo.create({
      data: {
        did,
        name,
      },
    })
    return Repo.open(prisma, did)
  }

  static async open(prisma: PrismaClient, didOrName: string): Promise<Repo> {
    if (Repo.cache && Repo.CACHE.has(didOrName)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      return Repo.CACHE.get(didOrName)!
    }

    const isDid = didOrName.startsWith('did:')
    const params: OpenParams = {}
    if (isDid) params.did = didOrName
    else params.name = didOrName

    const repo = await Repo.load(prisma, params)

    if (Repo.cache) {
      Repo.CACHE.set(repo.did, repo)
      if (repo.name) Repo.CACHE.set(repo.name, repo)
    }

    return repo
  }

  static async load(prisma: PrismaClient, params: OpenParams): Promise<Repo> {
    if (!params.did && !params.name) throw new Error('Invalid open params')
    const record = await prisma.repo.findFirst({
      where: { OR: [{ did: params.did }, { name: params.name }] },
    })
    if (!record) {
      throw new RepoError(ErrorCode.NOT_FOUND, `Repo not found`)
    }
    const did = record.did
    const keypairData = await prisma.keypair.findUnique({
      where: { did: record.did },
    })
    let keypair
    if (keypairData) {
      keypair = ucans.EdKeypair.fromSecretKey(keypairData.secret)
      if (keypair.did() !== did) {
        throw new RepoError(
          ErrorCode.INVALID,
          `Invalid secret key for did ${did}`,
        )
      }
    }
    const authority: Authority = { did, keypair }
    const repo = new Repo(prisma, record, authority)
    return repo
  }

  static async list(prisma: PrismaClient): Promise<RepoRecord[]> {
    const list = await prisma.repo.findMany()
    return list
  }

  constructor(
    prisma: PrismaClient | Prisma.TransactionClient,
    record: RepoRecord,
    authority: Authority,
    dsr?: DataSourceRegistry,
    bs?: IpldBlockStore,
  ) {
    this.record = record
    this.prisma = prisma
    this.dsr = dsr || new DataSourceRegistry()
    this.blockstore = bs || new PrismaIpldBlockStore(prisma)
    // this.blockstore = bs || LevelIpldBlockStore.createTemp(authority.did)
    this.authority = authority
  }

  private $transaction<R>(fn: (repo: Repo) => Promise<R>) {
    assertFullClient(this.prisma)
    return this.prisma.$transaction(async (tx) => {
      // console.time('tx')
      const self = new Repo(
        tx,
        this.record,
        this.authority,
        this.dsr,
        this.blockstore,
      )
      const res = await fn(self)
      // console.timeEnd('tx')
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
    return !!this.authority.keypair
  }

  registerDataSource(ds: DataSource) {
    this.dsr.register(ds)
  }

  createRevisionStream(from = '0', filter: RevisionFilter) {
    return new RevisionStream(this, false, from, filter)
  }

  createRevisionBatchStream(from = '0', filter: RevisionFilter) {
    return new RevisionStream(this, true, from, filter)
  }

  async fetchRevisionsWithContent(
    filter: RevisionFilter = {},
  ): Promise<FullEntity[]> {
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

  async getTail(): Promise<common.CID | null> {
    const row = await this.prisma.repo.findUnique({
      where: { did: this.did },
      select: { tail: true },
    })
    if (!row || !row.tail) return null
    return common.parseCid(row.tail)
  }

  async getHead(): Promise<common.CID | undefined> {
    const row = await this.prisma.repo.findUnique({
      where: { did: this.did },
      select: { head: true },
    })
    if (!row || !row.head) return undefined
    return common.parseCid(row.head)
  }

  async saveEntity(
    agentDid: string,
    input: any,
    headers: any = {},
  ): Promise<FullEntity> {
    const data = { ...input, ...headers }
    const res = await this.saveBatch(agentDid, [data])
    if (!res.length) throw new Error('Expected a result')
    return res[0]
  }

  async exportToCar(tail?: CID) {
    const head = await this.getHead()
    if (!head) throw new Error('Cannot export empty repo.')
    return exportRepoToCar(this.blockstore, head, tail)
  }

  async exportToCarReversed(tail?: CID, head?: CID) {
    head = head || (await this.getHead()) || undefined
    if (!head) throw new Error('Cannot export empty repo.')
    return exportRepoToCarReversed(this, head, tail)
  }

  async importFromCar(stream: AsyncIterable<Uint8Array>) {
    return importRepoFromCar(this, stream)
  }

  async saveBatch(agentDid: string, inputs: unknown[]) {
    if (!this.writeable) throw new Error('Repo is not writeable')
    // Parse and assign uids.
    const parsedInputs = await Promise.all(
      inputs.map((input) => this.parseAndAssignUid(input)),
    )

    // Resolve missing relations.
    const entities = await RelationFinder.resolve(this, parsedInputs)

    // Save the batch in one transaction.
    return this.$transaction(async (repo) => {
      const res = await repo.saveBatchInner(agentDid, entities)
      return res
    })
  }

  private async saveBatchInner(
    agentDid: string,
    entities: EntityInputWithHeaders[],
  ) {
    if (!this.authority.keypair) throw new Error('Repo is not writable')
    const timestamp = new Date()
    try {
      this.blockstore = this.blockstore.transaction()

      // save all revisions in blockstore
      const revisions = []
      for (const entity of entities) {
        const revision = await this.saveEntityIpld(agentDid, entity)
        revisions.push({ ...revision, parsedContent: entity })
      }

      // save commit ipld
      const parent = await this.getHead()
      const commit: CommitIpld = {
        kind: 'commit',
        repoDid: this.did,
        agentDid,
        parent,
        revisions: revisions.map((r) => r.revisionCid),
        timestamp,
      }
      const commitCid = await this.blockstore.put(commit)
      const root: RootIpld = {
        kind: 'root',
        commit: commitCid,
        sig: await this.authority.keypair.sign(commitCid.bytes),
      }
      const rootCid = await this.blockstore.put(root)

      // batch commit ipld changes
      this.blockstore = await this.blockstore.commit()

      const bundle = {
        root: { cid: rootCid, body: root },
        commit: { cid: commitCid, body: commit },
        revisions,
      }
      const ret = await this.saveFromIpld(bundle)
      return ret
    } catch (err) {
      console.error('TX FAILED', err)
      throw err
    }
  }

  async saveFromIpld(bundle: CommitBundle) {
    const commit = bundle.commit.body
    await this.ensureAgent(commit.agentDid)
    const revisions = bundle.revisions.map((r) => ({
      ...r,
      revisionDb: revisionIpldToDb(r.revision, r.revisionCid),
    }))
    await this.saveRevisionBatch(revisions.map((r) => r.revisionDb))
    await this.prisma.commit.create({
      data: {
        rootCid: bundle.root.cid.toString(),
        commitCid: bundle.commit.cid.toString(),
        repoDid: commit.repoDid,
        agentDid: commit.agentDid,
        parent: commit.parent ? commit.parent.toString() : null,
        timestamp: commit.timestamp,
        Revisions: {
          connect: commit.revisions.map((r) => ({
            revisionCid: r.toString(),
          })),
        },
      },
    })
    const head = bundle.root.cid.toString()
    const tail = commit.parent ? undefined : head
    await this.prisma.repo.update({
      where: { did: this.did },
      data: { head, tail },
    })

    const ret = []
    // update domain views
    for (const row of revisions) {
      const input =
        row.parsedContent ||
        repco.parseEntity(row.revision.entityType, row.content)
      const data = {
        ...input,
        revision: row.revisionDb,
        uid: row.revision.uid,
      }
      await this.updateDomainView(data)
      ret.push(data)
    }
    return ret
  }

  async parseAndAssignUid(input: unknown): Promise<EntityInputWithHeaders> {
    const headers = headersForm.parse(input)
    const parsed = entityForm.parse(input)
    const entity = repco.parseEntity(parsed.type, parsed.content)

    // check for previous revision
    let prevRevision
    let uid = entity.content.uid
    if (uid) {
      prevRevision = await this.prisma.revision.findFirst({
        where: { uid },
        select: REVISION_SELECT,
        orderBy: { id: 'desc' },
      })
    } else if (headers.entityUris?.length) {
      prevRevision = await this.prisma.revision.findFirst({
        where: { entityUris: { hasSome: headers.entityUris } },
        select: REVISION_SELECT,
        orderBy: { id: 'desc' },
      })
    }

    if (prevRevision) {
      if (prevRevision.entityType !== entity.type) {
        throw new Error(
          `Type mismatch: Previous revision has type ${prevRevision.entityType} and input has type ${entity.type}`,
        )
      }
      if (uid && uid !== prevRevision.uid) {
        throw new Error(
          `Uid mismatch: Previous revision has uid ${prevRevision.uid} and input has uid ${entity.content.uid}`,
        )
      }

      headers.dateCreated = prevRevision.dateCreated
      headers.prevRevisionId = prevRevision.id
      uid = prevRevision.uid
    } else {
      headers.prevRevisionId = null
      uid = createEntityId()
    }

    setUid(entity, uid)

    return { ...entity, headers }
  }

  private async saveEntityIpld(
    agentDid: string,
    entity: EntityInputWithHeaders,
    // ): Promise<FullEntity & { revisionCid: common.CID }> {
  ): Promise<RevisionWithUnknownContent> {
    const headers = entity.headers
    const contentCid = await this.blockstore.put(entity.content)
    const id = createRevisionId()
    if (!headers.dateModified) headers.dateModified = new Date()
    if (!headers.dateCreated) headers.dateCreated = new Date()
    const revisionWithoutCid: RevisionIpld = {
      kind: 'revision',
      id,
      prevRevisionId: headers.prevRevisionId || null,
      contentCid,
      entityType: entity.type,
      uid: entity.uid,
      repoDid: this.did,
      agentDid,
      revisionUris: headers.revisionUris || [],
      entityUris: headers.entityUris || [],
      isDeleted: false,
      dateModified: headers.dateModified || new Date(),
      dateCreated: headers.dateCreated || new Date(),
    }
    const revisionCid = await this.blockstore.put(revisionWithoutCid)
    return {
      revision: revisionWithoutCid,
      revisionCid,
      content: entity.content,
    }
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

  private async saveRevisionBatch(revisions: Revision[]): Promise<void> {
    await this.prisma.revision.createMany({
      data: revisions,
    })
    const deleteEntities = revisions
      .filter((r) => r.prevRevisionId)
      .map((r) => r.uid)
    await this.prisma.entity.deleteMany({
      where: { uid: { in: deleteEntities } },
    })
    const entityUpsert = revisions.map((revision) => ({
      uid: revision.uid,
      revisionId: revision.id,
      type: revision.entityType,
    }))
    await this.prisma.entity.createMany({
      data: entityUpsert,
    })
  }

  private async saveRevision(revision: Revision): Promise<void> {
    await this.prisma.revision.create({
      data: {
        ...revision,
      },
      select: { id: true },
    })
    const entityUpsert = {
      uid: revision.uid,
      revisionId: revision.id,
      type: revision.entityType,
    }
    await this.prisma.entity.upsert({
      where: { uid: revision.uid },
      create: entityUpsert,
      update: entityUpsert,
      select: { uid: true },
    })
  }

  private async updateDomainView(entity: FullEntity) {
    const domainUpsertPromise = repco.upsertEntity(
      this.prisma,
      entity.revision.uid,
      entity.revision.id,
      entity,
    )
    await domainUpsertPromise
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
        type: revision.entityType as FullEntity['type'],
        revision,
      } as EntityMaybeContent<T>
    }
  }

  async resolveContent(revision: Revision): Promise<FullEntity> {
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

class RelationFinder {
  prisma: Prisma.TransactionClient
  counter = 0
  // map of uid -> entity
  entities: Map<string, EntityInputWithHeaders> = new Map()
  // set not yet checked entity uris
  pendingUris: Set<string> = new Set()
  // map of uri -> Relation[]
  relsByUri: MapList<common.Relation> = new MapList()
  // set of uris checked and found missing
  missingUris: Set<string> = new Set()
  // map of uri -> uid
  uriMap: Map<string, string> = new Map()

  static resolve(repo: Repo, entities: EntityInputWithHeaders[]) {
    const resolver = new RelationFinder(repo)
    resolver.pushBatch(entities)
    return resolver.resolve()
  }

  constructor(public repo: Repo) {
    this.prisma = repo.prisma
  }

  pushLink(value: common.Link, relation: common.Relation) {
    // TODO: Throw if uri missing?
    if (value.uid || !value.uri || this.missingUris.has(value.uri)) return
    // check if already in map: resolve now
    if (this.uriMap.has(value.uri)) {
      value.uid = this.uriMap.get(value.uri)
    } else {
      this.relsByUri.push(value.uri, relation)
      this.pendingUris.add(value.uri)
    }
  }

  pushEntity(entity: EntityInputWithHeaders) {
    const uid = entity.uid
    if (this.entities.has(uid)) return
    this.entities.set(uid, entity)
    if (entity.headers.entityUris) {
      for (const uri of entity.headers.entityUris) {
        this.discoveredUid(uri, uid)
      }
    }
    const relations = repco.extractRelations({ ...entity, uid })
    for (const relation of relations) {
      for (const value of relation.values) {
        this.pushLink(value, relation)
      }
    }
  }

  pushBatch(entities: EntityInputWithHeaders[]) {
    entities.forEach((entity) => this.pushEntity(entity))
  }

  setLinkUid(
    entity: EntityInputWithHeaders,
    relation: common.Relation,
    uri: string,
    uid: string,
  ) {
    const { field, multiple } = relation
    const entityAny = entity as any
    if (multiple) {
      for (const link of entityAny.content[field] as common.Link[]) {
        if (link.uri === uri) link.uid = uid
      }
    } else {
      entityAny.content[field] = { uid, uri }
    }
  }

  discoveredUid(uri: string, uid: string) {
    this.uriMap.set(uri, uid)
    const relations = this.relsByUri.get(uri)
    if (!relations || !relations.length) return
    for (const relation of relations) {
      const entity = this.entities.get(relation.uid)
      if (entity) this.setLinkUid(entity, relation, uri, uid)
    }
    this.pendingUris.delete(uri)
  }

  getByUri(uri: string) {
    const uid = this.uriMap.get(uri)
    if (!uid) return
    return this.entities.get(uid)
  }

  async resolve() {
    // TODO: Max iterations
    while (this.pendingUris.size) {
      // create set of all uri relations
      // try to fetch them locally from the revision table
      const res = await this.prisma.revision.findMany({
        where: {
          entityUris: { hasSome: [...this.pendingUris] },
        },
        select: { uid: true, entityUris: true },
      })
      for (const row of res) {
        for (const uri of row.entityUris) {
          this.discoveredUid(uri, row.uid)
        }
      }

      // try to fetch them from the datasources
      const { fetched, notFound } = await this.repo.dsr.fetchEntities([
        ...this.pendingUris,
      ])
      notFound.forEach((uri) => {
        this.missingUris.add(uri)
        this.pendingUris.delete(uri)
      })
      // parse the fetched records and assign uids
      const entities = await Promise.all(
        fetched.map((input) => {
          if (input.entityUris) {
            // check if the entity was already fetched in this resolver session
            for (const uri of input.entityUris) {
              const entity = this.getByUri(uri)
              if (entity) return entity
            }
          }
          // otherwise, parse the newly found entity
          return this.repo.parseAndAssignUid(input)
        }),
      )
      this.pushBatch(entities)
    }

    // Sort the results. This also throws for ciruclar references.
    const graph = new GGraph()
    for (const entity of this.entities.values()) {
      const edges = repco
        .extractRelations(entity)
        .map((r) => r.values)
        .flat()
        .filter((x) => x.uid && this.entities.has(x.uid))
        .map((x) => x.uid) as string[]
      graph.push(entity.uid, edges)
    }
    const stack = graph.resolve()

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return stack.map((uid) => this.entities.get(uid)!)
  }
}

function assertFullClient(
  prisma: PrismaClient | Prisma.TransactionClient,
): asserts prisma is PrismaClient {
  // @ts-ignore
  if (prisma.$transaction === undefined) {
    throw new Error('Transaction may not be nested.')
  }
}
