import { EntityForm, Entity, EntityBatch, RevisionForm, AnyEntityContent, EntityFormContent } from "./entity.js";
import { z } from 'zod'
import { Prisma, zod, ContentGrouping, ContentItem, Revision, PrismaClient } from "./prisma.js"
import type { DataSource } from "./datasource.js";
import { createRevisionId } from "./helpers/id.js";
import { EntityInput, validateEntity, upsertEntity } from "repco-prisma/dist/generated/repco/index.js";


export async function storeEntityBatchFromDataSource (prisma: PrismaClient, datasource: DataSource, batch: EntityBatch) {
  for (const entity of batch.entities) {
    try {
      if (!entity.revision) entity.revision = {}
      entity.revision.datasource = datasource.definition.uid
      const _res = await storeEntity(prisma, entity)
      // console.log(`stored entity ${res.type} ${res.content.uid} @ ${res.revision.id}`)
    } catch (err) {
      // TODO: What to do on errors?
      console.error(`error saving ${entity.content.uid}: ${err}`)
      console.error(err)
      throw err
    }
  }
}

export async function storeEntity (prisma: PrismaClient, input: EntityForm): Promise<Entity> {
  if ((await findRevisionByAlternativeIds(prisma, input.revision?.alternativeIds)) !== null) {
    throw new Error('Revision exists')
  }
  const now = new Date()
  const previousRevisionId = await findLatestRevisionId(prisma, input.content.uid)
  const revisionId = createRevisionId(now)
  const revisionInput = {
    type: input.type,
    id: revisionId,
    uid: input.content.uid,
    datasource: input.revision?.datasource || 'unknown',
    created: now,
    alternativeIds: input.revision?.alternativeIds || [],
    previousRevisionId,
    content: input.content
  }
  const { entity, revision } = await storeRevision(prisma, revisionInput)
  return {
    revision,
    type: revision.type,
    content: entity.content
  }
}

async function findLatestRevisionId (prisma: PrismaClient, uid: string): Promise<string | null> {
  const previousRevision = await prisma.revision.findFirst({
    where: { uid },
    select: { id: true },
    orderBy: [{ created: 'desc' }]
  })
  return (previousRevision?.id) || null
}

async function findRevisionByAlternativeIds (prisma: PrismaClient, alternativeIds?: string[] | null): Promise<string | null> {
  if (!alternativeIds) return null
  const existing = await prisma.revision.findFirst({
    select: { id: true },
    where: {
      alternativeIds: { hasSome: alternativeIds }
    }
  })
  return (existing?.id) || null
}

export async function ingestRevisions (prisma: PrismaClient, revisions: RevisionCreateInput[]) {
  const storedRevisions = []
  for (const revision of revisions) {
    storedRevisions.push(await storeRevision(prisma, revision))
  }
  return storedRevisions
}


export type RevisionCreateInput = Omit<Prisma.RevisionCreateInput, "content"> & {
  content: Prisma.JsonValue | null | z.infer<typeof zod.RevisionModel>["content"]
}

export async function storeRevision(prisma: PrismaClient, revisionInput: any) {
  const validatedRevisionInput = zod.RevisionModel.parse(revisionInput)
  return await storeRevisionUnchecked(prisma, validatedRevisionInput)
}

export async function storeRevisionUnchecked(prisma: PrismaClient, revisionInput: RevisionCreateInput) {
  // store revision
  const revision = await prisma.revision.create({
    data: {
      ...revisionInput,
      content: revisionInput.content || Prisma.JsonNull
    }
  })
  // validate entity input
  const entityInput = {
    type: revisionInput.type,
    content: revisionInput.content
  }
  const validatedInput = validateEntity(entityInput.type, entityInput.content, revision.id)
  // upsert entity
  const entity = await upsertEntity(prisma, validatedInput, revision.id)
  return { revision, entity } 
}


export type FetchRevisionOpts = {
  from?: string
}

export async function fetchRevisions(prisma: PrismaClient, opts: FetchRevisionOpts) {
  const where: Prisma.RevisionWhereInput = {}
  if (opts.from) {
    where.id = { gte: opts.from }
  }
  const revisions = await prisma.revision.findMany({
    orderBy: [
      { id: 'asc' }
    ],
    where,
  })
  return revisions
}
