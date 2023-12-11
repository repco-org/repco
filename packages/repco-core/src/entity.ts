/**
 * We work with entities. An entity has a type, content and a revision.
 * An EntityBatch is retrieved from the datasource and persisted locally,
 * it can contain multiple entities and their associated revisions.
 * Furthermore the EntityBatch has a cursor which is usually a timestamp of the last retrieval of the entity.
 */

import z from 'zod'
import { revisionHeaders } from 'repco-common/schema'
import { repco } from 'repco-prisma'
import {
  ConceptKind,
  ContentGrouping,
  ContentGroupingVariant,
  ContentItem,
  MediaAsset,
  Revision,
} from './prisma.js'

export type { ContentItem, MediaAsset, ContentGrouping, Revision }
export { ContentGroupingVariant, ConceptKind }

export const headersForm = revisionHeaders.partial()
export interface HeadersForm extends z.infer<typeof headersForm> {}

export const entityForm = z.object({
  type: z.string(),
  content: z.object({}).passthrough(),
  headers: headersForm.nullish(),
})

export type AnyEntityContent = { uid: string }
export type AllEntityTypes = repco.EntityOutput['type']

export type EntityBatch = {
  cursor: string
  entities: EntityForm[]
}

export type EntityForm = repco.EntityInput & { headers?: HeadersForm }

export type EntityInputWithHeaders = repco.EntityInputWithUid & {
  headers: HeadersForm
  prevContentCid?: string
}

export type EntityInputWithRevision = repco.EntityInputWithUid & {
  revision: Revision
}

export type EntityMaybeContent<T extends boolean = true> = T extends true
  ? EntityInputWithRevision
  : T extends false
  ? Omit<EntityInputWithRevision, 'content'>
  : never

export type EntityWithRevision = EntityInputWithRevision

export type EntityType = repco.EntityOutput['type']

// TODO: This should be the output types.
export type TypedEntity<T extends EntityType> = Extract<
  repco.EntityInput,
  { type: T }
>
export type TypedEntityForm<T extends EntityType> = Extract<
  EntityForm,
  { type: T }
>
export type TypedEntityWithRevision<T extends EntityType> = TypedEntity<T> & {
  revision: Revision
  uid: string
}
export function filterType<T extends EntityType>(
  entities: EntityWithRevision[],
  type: T,
): TypedEntityWithRevision<T>[] {
  return entities.filter((x) => x.type === type) as TypedEntityWithRevision<T>[]
}

export function checkType<T extends EntityType>(
  entity: EntityWithRevision,
  type: T,
): asserts entity is TypedEntityWithRevision<T> {
  if (entity.type !== type)
    throw new Error(
      `Type mismatch: expected ${type} but received ${entity.type}`,
    )
}

export function safeCheckType<T extends EntityType>(
  entity: EntityWithRevision,
  type: T,
): TypedEntityWithRevision<T> | null {
  if (entity.type !== type) return null
  return entity as TypedEntityWithRevision<T>
}

export type UnknownEntityInput = {
  type: string
  content: unknown
  headers?: HeadersForm
}
