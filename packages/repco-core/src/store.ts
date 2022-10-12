/**
 * Saving an EntityBatch from a Datasource
 * ![diagram](packages/repco-core/diagrams/store.png)
 */

import {
  extractRelations,
  repco,
  upsertEntity,
  validateEntity,
} from 'repco-prisma'
import type { DataSourceRegistry } from './datasource.js'
import { Repo } from './repo.js'
import { AnyEntityContent, Entity, EntityForm } from './entity.js'
import { createRevisionId } from './helpers/id.js'
import { Prisma, PrismaClient, Revision } from './prisma.js'

export type Relation = repco.Relation
export type EntityInput = repco.EntityInput

export type FetchRevisionOpts = {
  from?: string
}

export async function fetchRevisions(
  prisma: PrismaClient,
  opts: FetchRevisionOpts,
) {
  const where: Prisma.RevisionWhereInput = {}
  if (opts.from) {
    where.id = { gte: opts.from }
  }
  const revisions = await prisma.revision.findMany({
    orderBy: [{ id: 'asc' }],
    where,
  })
  return revisions
}


export async function storeEntityWithDataSourceFallback(
  prisma: PrismaClient,
  datasources: DataSourceRegistry,
  input: EntityForm,
  repoUid = 'default',
) {
  const repo = new Repo(prisma, repoUid)
  repo.dsr = datasources
  return await repo.saveEntity('me', input)
}


// export async function storeEntityWithDataSourceFallback(
//   prisma: PrismaClient,
//   datasources: DataSourceRegistry,
//   input: EntityForm,
//   repoUid = 'default',
//   pendingEntities: Record<string, EntityForm> = {}
// ): Promise<Entity> {
//   try {
//     const out = await storeEntity(prisma, repoUid, input)
//     return out
//   } catch (err) {
//     if (err instanceof MissingRelationsError) {
//       console.log('fetch missing on', input.content.uid, 'pending', Object.keys(pendingEntities), 'missing', err.missingRelations.map(r => r.values))
//       await fetchAndStoreMissingRelations(
//         prisma,
//         datasources,
//         input.content.uid,
//         err.missingRelations,
//         repoUid,
//         pendingEntities
//       )
//       return await storeEntity(prisma, repoUid, input)
//     } else {
//       throw err
//     }
//   }
// }
// async function fetchAndStoreMissingRelations(
//   prisma: PrismaClient,
//   datasources: DataSourceRegistry,
//   parentUid: string,
//   missingRelations: Relation[],
//   repoUid: string,
//   pendingEntities: Record<string, EntityForm>
// ): Promise<void> {
//   for (const missingRelation of missingRelations) {
//     if (!missingRelation.values) continue
//     for (const uid of missingRelation.values) {
//       console.log(`MISSING on ${parentUid}: ${uid}`)
//       if (pendingEntities[uid]) throw new Error(`Circular references are not supported, detected circle between ${parentUid} and ${uid} on field ${missingRelation.fieldName}`)
//       const matchingSources = datasources.getForUID(uid)
//       if (!matchingSources.length) {
//         throw new Error(`No datasource registered that can fetch ${uid}`)
//       }
//       console.log('datasource loop start', parentUid, uid)
//       for (const datasource of matchingSources) {
//         const entities = await datasource.fetchByUID(uid)
//         if (entities && entities.length) {
//           console.log(`  fetched missing: ${entities.map(e => e.content.uid)}`)
//           for (const entity of entities) {
//             pendingEntities[entity.content.uid] = entity
//           }
//           for (const entity of entities) {
//             await storeEntityWithDataSourceFallback(prisma, datasources, entity, repoUid, pendingEntities)
//           }
//           break
//         }
//       }
//       console.log('datasource loop end', parentUid, uid)
//     }
//   }
// }

// export async function storeEntity(
//   prisma: PrismaClient,
//   repoUid: string,
//   input: EntityForm,
// ): Promise<Entity> {
//   // check for an existing revision for the alternative ids provided
//   const existingRevision = await findRevisionByAlternativeIds(
//     prisma,
//     input.revision?.alternativeIds,
//   )
//   if (existingRevision !== null) {
//     return {
//       revision: existingRevision,
//       type: existingRevision.type,
//       content: existingRevision.content as unknown as AnyEntityContent,
//     }
//   }

//   const now = new Date()
//   const previousRevisionId = await findLatestRevisionId(
//     prisma,
//     input.content.uid,
//   )

//   const revisionId = createRevisionId(now)
//   const revisionInput = {
//     type: input.type,
//     id: revisionId,
//     uid: input.content.uid,
//     datasource: input.revision?.datasource || 'unknown',
//     created: now,
//     alternativeIds: input.revision?.alternativeIds || [],
//     previousRevisionId: previousRevisionId || undefined,
//     content: input.content as any,
//     repo: {
//       connectOrCreate: { where: { uid: repoUid }, create: { uid: repoUid } },
//     },
//   }
//   const { entity, revision } = await storeRevision(prisma, revisionInput)
//   return {
//     revision,
//     type: revision.type,
//     content: entity.content,
//   }
// }

// async function findLatestRevisionId(
//   prisma: PrismaClient,
//   uid: string,
// ): Promise<string | null> {
//   const previousRevision = await prisma.revision.findFirst({
//     where: { uid },
//     select: { id: true },
//     orderBy: [{ created: 'desc' }],
//   })
//   return previousRevision?.id || null
// }

// async function findRevisionByAlternativeIds(
//   prisma: PrismaClient,
//   alternativeIds?: string[] | null,
// ): Promise<Revision | null> {
//   if (!alternativeIds) return null
//   const existing = await prisma.revision.findFirst({
//     // select: { id: true },
//     where: {
//       alternativeIds: { hasSome: alternativeIds },
//     },
//   })
//   return existing || null
// }

// export async function ingestRevisions(
//   prisma: PrismaClient,
//   revisions: RevisionCreateInput[],
// ) {
//   const storedRevisions = []
//   for (const revision of revisions) {
//     storedRevisions.push(await storeRevision(prisma, revision))
//   }
//   return storedRevisions
// }

// export type RevisionCreateInput = Prisma.RevisionCreateInput

// export async function storeRevision(
//   prisma: PrismaClient,
//   revisionInput: Prisma.RevisionCreateInput,
// ) {
//   return await storeRevisionUnchecked(prisma, revisionInput)
// }

// export class MissingRelationsError extends Error {
//   constructor(public missingRelations: Relation[]) {
//     super(
//       `Missing relations: ${missingRelations.map(
//         (r) =>
//           `${r.fieldName} -> ${r.targetType} ${r.values
//             ?.map((v) => `"${v}"`)
//             .join(', ')}`,
//       )}`,
//     )
//   }
// }

// export async function storeRevisionUnchecked(
//   prisma: PrismaClient,
//   revisionInput: RevisionCreateInput,
// ) {
//   // validate entity input
//   const entityInput = {
//     type: revisionInput.type,
//     content: revisionInput.content,
//   }
//   // const validatedInput = entityInput as EntityInput
//   // TODO: Fix validation for relation fields.
//   const validatedInput = validateEntity(
//     entityInput.type,
//     entityInput.content,
//     revisionInput.id,
//   )
//   // check relations
//   const missingRelations = await findMissingRelations(prisma, validatedInput)
//   if (missingRelations) {
//     throw new MissingRelationsError(missingRelations)
//   }
//   // upsert entity
//   const revisionData = {
//     ...revisionInput,
//     content: revisionInput.content || Prisma.JsonNull,
//   }
//   const entity = await upsertEntity(prisma, validatedInput, revisionData)
//   const revision = await prisma.revision.findUnique({
//     where: { id: revisionInput.id },
//   })
//   if (!revision) throw new Error('Failed to create revision')
//   return { revision, entity }
// }

// async function findMissingRelations(prisma: PrismaClient, input: EntityInput) {
//   const missing = []
//   const relations = extractRelations(input)
//   for (const relation of relations) {
//     if (!relation.values || !relation.values.length) continue
//     const existing = await prisma.revision.findMany({
//       select: { id: true, uid: true, type: true },
//       where: {
//         type: relation.targetType,
//         uid: {
//           in: relation.values,
//         },
//       },
//     })
//     const missingValues = []
//     const values = existing.map((row) => row.uid)
//     for (const value of relation.values) {
//       if (!values.includes(value)) missingValues.push(value)
//     }
//     if (missingValues.length) {
//       missing.push({
//         ...relation,
//         values: missingValues,
//       })
//     }
//   }
//   if (missing.length) return missing
//   else return null
// }

// export type FetchRevisionOpts = {
//   from?: string
// }

// export async function fetchRevisions(
//   prisma: PrismaClient,
//   opts: FetchRevisionOpts,
// ) {
//   const where: Prisma.RevisionWhereInput = {}
//   if (opts.from) {
//     where.id = { gte: opts.from }
//   }
//   const revisions = await prisma.revision.findMany({
//     orderBy: [{ id: 'asc' }],
//     where,
//   })
//   return revisions
// }
