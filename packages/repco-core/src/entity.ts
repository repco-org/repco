/**
 * We work with entities. An entity has a type, content and a revision.
 * An EntityBatch is retrieved from the datasource and persisted locally,
 * it can contain multiple entities and their associated revisions.
 * Furthermore the EntityBatch has a cursor which is usually a timestamp of the last retrieval of the entity.
 */

import { repco } from 'repco-prisma'
import {
  ContentGrouping,
  ContentGroupingVariant,
  ContentItem,
  MediaAsset,
  Revision,
} from './prisma.js'

export type { ContentItem, MediaAsset, ContentGrouping, Revision }
export { ContentGroupingVariant }
// export type AnyEntityContent = repco.EntityOutput['content']
export type AnyEntityContent = { uid: string }
export type AnyEntityType = repco.EntityOutput['type']

export type EntityBatch = {
  cursor: string
  entities: EntityForm[]
}

export type Entity = {
  type: string,
  content: AnyEntityContent
  revision: Revision
}

export type EntityMaybeContent<T extends boolean = true> = 
  T extends true ? Entity : 
  T extends false ? Omit<Entity, 'content'> :
  never

export type TypedEntity<T extends AnyEntityType> = {
  type: T,
  content: Extract<repco.EntityOutput, { type: T }>["content"]
  revision: Revision
}

export type MaybeTypedEntity<T = any> = {
  type: T extends AnyEntityType ? T : string,
  content: T extends AnyEntityType ? Extract<repco.EntityOutput, { type: T }>["content"] : AnyEntityContent
  revision: Revision
}

export function assumeType<T extends AnyEntityType>(entity: Entity): TypedEntity<T> {
  return entity as TypedEntity<T>
}

export type EntityFormContent = Omit<AnyEntityContent, 'revisionId'>

export type EntityForm = repco.EntityInput & {
  revision?: RevisionForm
}

export type RevisionForm = {
  uid?: string
  type?: string
  datasource?: string
  created?: Date
  alternativeIds?: string[]
}

export type EntityRevision = repco.EntityOutput & {
  revision: Omit<Revision, 'content'>
}
