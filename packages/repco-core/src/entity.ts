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

export type Entity = {
  type: string
  uid: string
  content: Record<string, unknown>
  revision: Revision
}

export type EntityMaybeContent<T extends boolean = true> = T extends true
  ? Entity
  : T extends false
  ? Omit<Entity, 'content'>
  : never

export type EntityRevision = repco.EntityOutput & {
  revision: Omit<Revision, 'content'>
}

// export type RevisionForm = {
//   uid?: string
//   type?: string
//   datasource?: string
//   created?: Date
//   alternativeIds?: string[]
// }
// export type TypedEntity<T extends AnyEntityType> = {
//   type: T,
//   content: Extract<repco.EntityOutput, { type: T }>["content"]
//   revision: Revision
// }

// export type MaybeTypedEntity<T = any> = {
//   type: T extends AnyEntityType ? T : string,
//   content: T extends AnyEntityType ? Extract<repco.EntityOutput, { type: T }>["content"] : AnyEntityContent
//   revision: Revision
// }

// export function assumeType<T extends AllEntityTypes>(entity: Entity): TypedEntity<T> {
//   return entity as TypedEntity<T>
// }

// export type EntityFormContent = Omit<AnyEntityContent, 'revisionId'>
