/**
 * We work with entities. An entity has a type, content and a revision.
 * An EntityBatch is retrieved from the datasource and persisted locally,
 * it can contain multiple entities and their associated revisions.
 * Furthermore the EntityBatch has a cursor which is usually a timestamp of the last retrieval of the entity.
 */

import { repco } from 'repco-prisma'
import { Headers } from './mod.js'
import {
  ContentGrouping,
  ContentGroupingVariant,
  ContentItem,
  MediaAsset,
  Revision,
} from './prisma.js'

export type { ContentItem, MediaAsset, ContentGrouping, Revision }
export { ContentGroupingVariant }

export type AnyEntityContent = { uid: string }
export type AllEntityTypes = repco.EntityOutput['type']

export type EntityBatch = {
  cursor: string
  entities: EntityForm[]
}

export type EntityForm = repco.EntityInput & Headers

export type EntityInputWithHeaders = repco.EntityInputWithUid & {
  headers: Headers
}

export type EntityInputWithRevision = repco.EntityInputWithUid & {
  revision: Revision
}

export type EntityMaybeContent<T extends boolean = true> = T extends true
  ? EntityInputWithRevision
  : T extends false
  ? Omit<EntityInputWithRevision, 'content'>
  : never

// TODO: This should be the output types.
export type EntityWithRevision = EntityInputWithRevision
// export type EntityWithRevision = repco.EntityInputWithUid & {
//   revision: Revision
// }

export type EntityType = repco.EntityOutput['type']

// TODO: This should be the output types.
export type TypedEntity<T extends EntityType> = Extract<
  repco.EntityInput,
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
