import * as common from 'repco-common/zod'
import * as z from 'zod'
import {
  Block,
  extractRelations,
  parseEntity,
  Prisma,
  PrismaClient,
  repco,
  Revision,
} from 'repco-prisma'
import { Readable } from 'streamx'
import { DataSourceRegistry } from './datasource.js'
import { FullEntity, EntityMaybeContent } from './entity.js'
import { createEntityId, createRevisionId } from './helpers/id.js'
import { IpldBlockStore, PrimsaIpldBlockStore } from './repo/blockstore.js'
import { URI } from './repo/uri.js'

const REVISION_SELECT = {
  id: true,
  entityType: true,
  dateCreated: true,
  uid: true,
}

type RevisionFilter = {
  from?: string
  type?: string[]
}

export class RevisionStream<
  B extends boolean,
  T extends B extends false ? Revision : Revision[],
> extends Readable<T> {
  finished = false

  constructor(
    public repo: Repo,
    public readonly batch: B,
    public cursor: string = '',
    public filter: RevisionFilter = {},
  ) {
    super()
  }

  async _read(cb: (err?: Error | null) => void) {
    try {
      const revisions = await this._fetchRevisions()

      if (!revisions.length) {
        // finished!
        this.finished = true
        this.push(null)
        cb(null)
        return
      }

      if (this.batch) {
        this.cursor = revisions[revisions.length - 1].id
        this.push(revisions as T)
      } else {
        for (const revision of revisions) {
          this.cursor = revision.id
          this.push(revision as T)
        }
      }
      cb(null)
    } catch (err) {
      cb(err as Error)
    }
  }

  async _fetchRevisions() {
    const where: Prisma.RevisionWhereInput = {
      repoUid: this.repo.uid,
      id: { gt: this.cursor },
    }
    if (this.filter.type) {
      where.entityType = { in: this.filter.type }
    }
    const revisions = await this.repo.prisma.revision.findMany({
      orderBy: [{ id: 'asc' }],
      take: 10,
      where,
    })
    return revisions
  }
}

export class Repo {
  // static async create(prisma: PrismaClient, uid: string) {
  // }

  // static async open(prisma: PrismaClient, uid: string) {
  // }

  public dsr: DataSourceRegistry
  public blockstore: IpldBlockStore
  public readonly uid: string
  public prisma: PrismaClient

  constructor(prisma: PrismaClient, uid: string) {
    this.uid = uid
    this.prisma = prisma
    this.dsr = new DataSourceRegistry()
    this.blockstore = new PrimsaIpldBlockStore(prisma)
  }

  async ensureCreated() {
    const data = { uid: this.uid }
    await this.prisma.repo.upsert({
      where: { uid: this.uid },
      create: data,
      update: data,
    })
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
      repoUid: this.uid,
    }
    if (filter.from) {
      where.id = { gt: filter.from }
    }
    if (filter.type) {
      where.entityType = { in: filter.type }
    }
    const revisions = await this.prisma.revision.findMany({
      where,
      include: { ContentBlock: true },
    })
    return revisions.map((r) => this.maybeResolveContent(r, true))
  }

  async updateEntity(
    agentUid: string,
    prevRevisionId: string,
    input: unknown,
    headers: Headers = {},
  ) {
    headers.prevRevisionId = prevRevisionId
    return this.saveEntity(agentUid, input, headers)
  }

  async saveEntity(
    agentUid: string,
    input: unknown,
    headers: Headers = {},
  ): Promise<FullEntity> {
    const parsed = entityForm.parse(input)
    const entityInput = parseEntity(parsed.type, parsed.content)
    const entity = await this.checkAndPrepareEntity(agentUid, entityInput, headers)
    await this.saveEntityUnchecked(entity)
    return entity
  }

  async checkAndPrepareEntity(
    agentUid: string,
    entity: repco.EntityInput,
    headers: Headers = {},
  ): Promise<FullEntity> {
    // if (entity.content.uid) {
    //   throw new Error('Setting the uid manually is not supported.')
    // }

    // check for existing revision by revision uri
    if (headers.revisionUris?.length) {
      const existing = await this.getFirst(
        {
          revisionUris: { hasSome: headers.revisionUris },
        },
        true,
      )
      if (existing) return existing
    }

    // check for previous revision
    let prevRevision
    let uid = entity.content.uid
    if (headers.prevRevisionId) {
      prevRevision = await this.prisma.revision.findUnique({
        where: { id: headers.prevRevisionId },
        select: REVISION_SELECT,
      })
      if (!prevRevision) {
        throw new Error(
          `Previous revision \`${headers.prevRevisionId}\` not found.`,
        )
      }
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
          `Uid mismatch: Previous revision has uid ${prevRevision.uid} and input has type ${entity.content.uid}`,
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

    // check relations
    const { missing } = await this.checkRelations(uid, entity, false)
    if (missing.length) {
      const { fetched, notFound } = await this.dsr.fetchEntities(missing)
      // TODO: circular..
      for (const entity of fetched) {
        await this.saveEntity(agentUid, entity, entity)
      }
    }

    const contentCid = await this.blockstore.put(entity.content)
    // check for existing revision by encoded content cid
    const existing = await this.getUnique(
      { contentCid: contentCid.toString() },
      true,
    )
    if (existing) return existing

    const id = createRevisionId()

    if (!headers.dateModified) headers.dateModified = new Date()
    if (!headers.dateCreated) headers.dateCreated = new Date()
    const revisionWithoutCid: RevisionWithoutCid = {
      id,
      prevRevisionId: headers.prevRevisionId || null,
      contentCid: contentCid.toString(),
      entityType: entity.type,
      uid,
      repoUid: this.uid,
      agentUid,
      revisionUris: headers.revisionUris || [],
      entityUris: headers.entityUris || [],
      isDeleted: false,
      dateModified: headers.dateModified || new Date(),
      dateCreated: headers.dateCreated || new Date(),
    }
    const revisionCid = await this.blockstore.put(revisionWithoutCid)
    const revision: Revision = {
      ...revisionWithoutCid,
      revisionCid: revisionCid.toString(),
    }
    return {
      ...entity,
      revision,
    }
  }

  // TODO: We do unchecked type mangling here.
  private async saveEntityUnchecked(
    entity: FullEntity
  ): Promise<void> {
    await this.saveRevision(entity.revision)
    await this.updateDomainView(entity)
  }

  async ensureAgent(uid: string) {
    await this.prisma.agent.upsert({
      where: { uid },
      create: { uid },
      update: { uid },
    })
  }

  async saveRevision(revision: Revision): Promise<void> {
    await this.ensureAgent(revision.agentUid)
    const entityUpsert = {
      uid: revision.uid,
      revisionId: revision.id,
      type: revision.entityType,
    }
    console.log('blocks', await this.prisma.block.findMany())
    console.log('save', revision)
    await this.prisma.$transaction([
      this.prisma.revision.create({
        data: {
          ...revision,
        },
        select: { id: true },
      }),
      this.prisma.entity.upsert({
        where: { uid: revision.uid },
        create: entityUpsert,
        update: entityUpsert,
        select: { uid: true },
      }),
    ])
  }
  async updateDomainView(
    entity: FullEntity
  ) {
    const domainUpsertPromise = repco.upsertEntity(
      this.prisma,
      entity.content.uid,
      entity.revision.id,
      entity,
    )
    await domainUpsertPromise
  }

  async fetchMissingRelations(missing: string[]) {}

  async checkRelations(
    uid: string,
    entity: repco.EntityInput,
    strict: boolean,
  ): Promise<{ entity: repco.EntityInput; missing: string[] }> {
    // check relations
    const relations = extractRelations({ uid, ...entity }).filter(
      (x) => x.values,
    )
    const links = relations.reduce(
      (list, cur) => [...list, ...(cur.values || [])],
      [] as common.Link[],
    )
    const uids: string[] = []
    const uris: string[] = []
    for (const link of links) {
      if (link.uid) {
        uids.push(link.uid)
      } else if (link.uri) {
        uris.push(link.uri)
      }
    }
    const map: Record<string, string> = {}
    if (uris.length) {
      const res = await this.prisma.revision.findMany({
        where: { entityUris: { hasSome: uris } },
        select: { uid: true, entityUris: true },
      })
      for (const row of res) {
        for (const uri of row.entityUris) {
          map[uri] = row.uid
        }
      }
    }
    if (uids.length) {
      const res = await this.prisma.revision.findMany({
        where: { uid: { in: uids } },
        select: { uid: true },
      })
      for (const row of res) {
        const uri = URI.fromEntity(row.uid).toString()
        map[uri] = row.uid
      }
    }

    const missing = []
    for (const relation of relations) {
      if (!relation.values) continue
      for (const [i, value] of relation.values.entries()) {
        // try {
        const uri = URI.fromLink(value).toString()
        const uid = map[uri]
        if (!uid) {
          if (strict) {
            throw new RelationNotFoundError(uri, relation)
          } else {
            // in non-strict mode allow references to repco entities
            // others are skipped
            // TODO: record missing uris in database
            // const uri = URI.parse(value)
            // if (uri.repco) {
            //   map[value] = uri.toString()
            // }
            missing.push(uri)
          }
        }
        if (relation.isList) {
          ;(entity as any).content[relation.fieldName][i] = { uid }
        } else {
          ;(entity as any).content[relation.fieldName] = { uid }
        }
      }
    }
    return { entity, missing }
  }

  async getUnique<T extends boolean>(
    where: Prisma.RevisionWhereUniqueInput,
    includeContent: T,
  ): Promise<EntityMaybeContent<T> | null> {
    const include = includeContent ? { ContentBlock: true } : null
    const revision = await this.prisma.revision.findUnique({
      where,
      include,
    })
    if (!revision) return null
    return this.maybeResolveContent(revision, includeContent)
  }

  async getFirst<T extends boolean>(
    where: Prisma.RevisionWhereInput,
    includeContent: T,
  ): Promise<EntityMaybeContent<T> | null> {
    const include = includeContent ? { ContentBlock: true } : null
    const revision = await this.prisma.revision.findFirst({
      where,
      include,
    })
    if (!revision) return null
    return this.maybeResolveContent(revision, includeContent)
  }

  maybeResolveContent<T extends boolean>(
    revision: Revision & { ContentBlock?: Block },
    includeContent: T,
  ): EntityMaybeContent<T> {
    if (includeContent && revision.ContentBlock) {
      const bytes = revision.ContentBlock.bytes
      revision.ContentBlock = undefined
      return this.resolveContent(revision, bytes) as EntityMaybeContent<T>
    } else {
      return {
        type: revision.entityType as FullEntity['type'],
        revision,
      } as EntityMaybeContent<T>
    }
  }

  resolveContent(
    revision: Revision,
    contentBytes: Buffer | Uint8Array,
  ): FullEntity {
    const rawContent = this.blockstore.parse(contentBytes)
    const entity = parseEntity(revision.entityType, rawContent)
    setUid(entity, revision.uid)
    return {
      ...entity,
      revision,
    }
  }

  // saveEntityUpdate(revisionId: string, input: unknown) {
  //   const parsed = EntityInputModel.parse(input)
  //   const entity = validateEntity(parsed.type, parsed.content)
  // }
}

export class RelationNotFoundError extends Error {
  constructor(public value: string, public relation: common.Relation) {
    super(`Related entity not found: ${value} on ${relation.fieldName}`)
  }
}

const headerModel = z.object({
  // TODO: uid / did
  agent: z.string().nullish(),
  dateModified: z.date().nullish(),
  dateCreated: z.date().nullish(),
  revisionUris: z.array(z.string()).optional(),
  entityUris: z.array(z.string()).optional(),
  prevRevisionId: z.string().nullish(),
  isDeleted: z.string().nullish(),
})
export interface Headers extends z.infer<typeof headerModel> {}

const entityForm = z.object({
  type: z.string(),
  content: z.object({}).passthrough(),
  headers: headerModel.nullish(),
})

export type RevisionWithoutCid = Omit<Revision, 'revisionCid'>

function setUid(input: repco.EntityInput, uid: string): asserts input is repco.EntityInputWithUid {
  input.content.uid = uid
}

class BatchState {
  counter = 0
  visited: Set<string> = new Set()
  unvisited: Set<string> = new Set()
  missing: Set<string> = new Set()

  uriUid: Map<string, string> = new Map()
  uidUris: Map<string, string[]> = new Map()

  // pending: string[] = []
  // notFound: string[] = []
  // found: string[] = []
}

// const headerModelWithDefaults = headerModel.default({
//   dateModified: null,
//   dateCreated: null,
//   revisionUris: [],
//   entityUris: [],
//   prevRevisionId: null,
//   isDeleted: null,
// })
// const headerModel = z.object({
//   dateModified: z.date().nullish().default(null),
//   dateCreated: z.date().nullish().default(null),
//   revisionUris: z.array(z.string()),
//   entityUris: z.array(z.string()),
//   prevRevisionId: z.string().nullish().default(null),
//   isDeleted: z.string().nullish().default(null),
// })

// interface EntityForm extends z.infer<typeof entityForm> {}
// type IncludeArg<T> = T extends true
//   ? Prisma.RevisionInclude
//   : T extends false
//   ? null
//   : never

// function includeArg<U extends boolean>(includeContent: U): IncludeArg<U> {
//   if (includeContent) {
//     return { ContentBlock: true } as IncludeArg<U>
//   } else {
//     return null as IncludeArg<U>
//   }
// }
