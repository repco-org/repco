import * as z from 'zod'
import {
  Block,
  extractRelations,
  Prisma,
  PrismaClient,
  repco,
  Revision,
  validateEntity,
} from 'repco-prisma'
import { Readable } from 'streamx'
import { DataSourceRegistry } from './datasource.js'
import { Entity, EntityMaybeContent } from './entity.js'
import { createEntityId } from './helpers/id.js'
import { createRevisionId } from './mod.js'
import { IpldBlockStore, PrimsaIpldBlockStore } from './repo/blockstore.js'
import { URI } from './repo/uri.js'

const REVISION_SELECT = {
  id: true,
  entityType: true,
  dateCreated: true,
  entityUid: true,
}

type RevisionFilter = {
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

  createRevisionStream(from = '0', filter: RevisionFilter) {
    return new RevisionStream(this, false, from, filter)
  }

  createRevisionBatchStream(from = '0', filter: RevisionFilter) {
    return new RevisionStream(this, true, from, filter)
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
  ): Promise<Entity> {
    const { type, revision, content } = await this.checkAndPrepareEntity(
      agentUid,
      input,
      headers,
    )
    return await this.saveEntityUnchecked(revision, {
      type,
      content,
    } as repco.EntityInput)
  }

  async checkAndPrepareEntity(
    agentUid: string,
    input: unknown,
    headers: Headers = {},
  ): Promise<Entity> {
    const parsed = entityForm.parse(input)
    const entity = validateEntity(parsed.type, parsed.content)
    if (entity.content.uid) {
      throw new Error('Setting the uid manually is not supported.')
    }

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

    // check relations
    await this.checkRelations(entity, true)

    // check for previous revision
    let prevRevision
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
      if (entity.content.uid && entity.content.uid !== prevRevision.entityUid) {
        throw new Error(
          `Uid mismatch: Previous revision has uid ${prevRevision.entityUid} and input has type ${entity.content.uid}`,
        )
      }

      headers.dateCreated = prevRevision.dateCreated
      headers.prevRevisionId = prevRevision.id
      entity.content.uid = prevRevision.entityUid
    } else {
      headers.prevRevisionId = null
      entity.content.uid = createEntityId()
    }

    const contentCid = await this.blockstore.put(entity)
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
      entityUid: entity.content.uid,
      repoUid: this.uid,
      agentUid,
      revisionUris: headers.revisionUris || [],
      entityUris: headers.entityUris || [],
      isDeleted: false,
      dateModified: headers.dateModified || new Date(),
      dateCreated: headers.dateCreated || new Date(),
    }
    const revisionCid = this.blockstore.put(revisionWithoutCid)
    const revision: Revision = {
      ...revisionWithoutCid,
      revisionCid: revisionCid.toString(),
    }
    return { revision, content: entity.content, type: revision.entityType } as Entity
  }

  async saveEntityUnchecked(revision: Revision, entity: repco.EntityInput) {
    await this.saveRevision(revision)
    await this.updateDomainView(revision.id, entity)

    const ret = {
      type: revision.entityType,
      revision,
      content: entity.content,
    }
    return ret
  }

  async saveRevision(revision: Revision): Promise<void> {
    const entityUpsert = {
      uid: revision.entityUid,
      revisionId: revision.id,
      type: revision.entityType,
    }
    await this.prisma.$transaction([
      this.prisma.revision.create({
        data: revision,
        select: {},
      }),
      this.prisma.entity.upsert({
        where: { uid: revision.entityUid },
        create: entityUpsert,
        update: entityUpsert,
        select: {},
      }),
    ])
  }
  async updateDomainView(revisionId: string, entity: repco.EntityInput) {
    // const entity = (await this.blockstore.get(CID.parse(revision.contentCid))) as repco.EntityInput
    const domainUpsertPromise = repco.upsertEntity2(
      this.prisma,
      entity,
      revisionId,
    )
    await domainUpsertPromise
  }

  async checkRelations(
    entity: repco.EntityInput,
    strict: boolean,
  ): Promise<repco.EntityInput> {
    // check relations
    const relations = extractRelations(entity).filter((x) => x.values)
    const values = relations.reduce(
      (list, cur) => [...list, ...(cur.values || [])],
      [] as string[],
    )
    const entityUids = []
    const entityUris = []
    for (const value of values) {
      const uri = URI.parse(value)
      if (uri.repco) {
        entityUids.push(uri.repco.entityUid)
      } else {
        entityUris.push(uri.uri)
      }
    }
    const map: Record<string, string> = {}
    if (entityUris.length) {
      const res = await this.prisma.revision.findMany({
        where: { entityUris: { hasSome: entityUris } },
        select: { entityUid: true, entityUris: true },
      })
      for (const row of res) {
        for (const uri of row.entityUris) {
          map[uri] = row.entityUid
        }
      }
    }
    if (entityUids.length) {
      const res = await this.prisma.revision.findMany({
        where: { entityUid: { in: entityUids } },
        select: { entityUid: true },
      })
      for (const row of res) {
        map[URI.fromEntity(row.entityUid).toString()] = row.entityUid
      }
    }

    for (const relation of relations) {
      if (!relation.values) continue
      for (const [i, value] of relation.values.entries()) {
        if (!map[value]) {
          if (strict) {
            throw new RelationNotFoundError(value, relation)
          } else {
            // in non-strict mode allow references to repco entities
            // others are skipped
            // TODO: record missing uris in database
            const uri = URI.parse(value)
            if (uri.repco) {
              map[value] = uri.toString()
            }
          }
        }
        if (relation.isList) {
          ;(entity as any).content[relation.fieldName][i] = map[value]
        } else {
          ;(entity as any).content[relation.fieldName] = map[value]
        }
      }
    }
    return entity
  }

  async getUnique<T extends boolean>(
    where: Prisma.RevisionWhereUniqueInput,
    includeContent: T,
  ): Promise<EntityMaybeContent<T> | null> {
    const include = includeContent ? { RevisionBlock: true } : null
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
    const include = includeContent ? { RevisionBlock: true } : null
    const revision = await this.prisma.revision.findFirst({
      where,
      include,
    })
    if (!revision) return null
    return this.maybeResolveContent(revision, includeContent)
  }

  maybeResolveContent<T extends boolean>(
    revision: Revision & { RevisionBlock?: Block },
    includeContent: T,
  ): EntityMaybeContent<T> {
    if (includeContent && revision.RevisionBlock) {
      const bytes = revision.RevisionBlock.bytes
      revision.RevisionBlock = undefined
      return this.resolveContent(revision, bytes) as EntityMaybeContent<T>
    } else {
      return {
        type: revision.entityType as Entity['type'],
        revision,
      } as EntityMaybeContent<T>
    }
  }

  resolveContent(
    revision: Revision,
    contentBytes: Buffer | Uint8Array,
  ): Entity {
    const content = this.blockstore.parse(contentBytes)
    return {
      type: revision.entityType as Entity['type'],
      content: content as Entity['content'],
      revision: revision,
    }
  }

  // saveEntityUpdate(revisionId: string, input: unknown) {
  //   const parsed = EntityInputModel.parse(input)
  //   const entity = validateEntity(parsed.type, parsed.content)
  // }
}

export class RelationNotFoundError extends Error {
  constructor(public value: string, public relation: repco.Relation) {
    super(`Related entity not found: ${value} on ${relation.fieldName}`)
  }
}

const headerModel = z.object({
  dateModified: z.date().nullish(),
  dateCreated: z.date().nullish(),
  revisionUris: z.array(z.string()).optional(),
  entityUris: z.array(z.string()).optional(),
  prevRevisionId: z.string().nullish(),
  isDeleted: z.string().nullish(),
})
// const headerModelWithDefaults = headerModel.default({
//   dateModified: null,
//   dateCreated: null,
//   revisionUris: [],
//   entityUris: [],
//   prevRevisionId: null,
//   isDeleted: null,
// })
export interface Headers extends z.infer<typeof headerModel> {}

// const headerModel = z.object({
//   dateModified: z.date().nullish().default(null),
//   dateCreated: z.date().nullish().default(null),
//   revisionUris: z.array(z.string()),
//   entityUris: z.array(z.string()),
//   prevRevisionId: z.string().nullish().default(null),
//   isDeleted: z.string().nullish().default(null),
// })

const entityForm = z.object({
  type: z.string(),
  content: z.object({}),
  headers: headerModel.nullish(),
})

interface EntityForm extends z.infer<typeof entityForm> {}

type IncludeArg<T> = T extends true
  ? Prisma.RevisionInclude
  : T extends false
  ? null
  : never

function includeArg<U extends boolean>(includeContent: U): IncludeArg<U> {
  if (includeContent) {
    return { RevisionBlock: true } as IncludeArg<U>
  } else {
    return null as IncludeArg<U>
  }
}

export type RevisionWithoutCid = Omit<Revision, 'revisionCid'>
