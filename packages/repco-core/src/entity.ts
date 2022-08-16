import {
  EntityInput,
  EntityOutput,
} from 'repco-prisma/dist/generated/repco/index.js'
import {
  ContentGrouping,
  ContentGroupingVariant,
  ContentItem,
  MediaAsset,
  Revision,
} from './prisma.js'

/**
 * We work with entities. An entity has a type, content and a revision.
 * An EntityBatch is retrieved from the datasource and persisted locally,
 * it can contain multiple entities and their associated revisions.
 * Furthermore the EntityBatch has a cursor which is usually a timestamp of the last retrieval of the entity.
 */

export type { ContentItem, MediaAsset, ContentGrouping, Revision }
export { ContentGroupingVariant }
export type AnyEntityContent = EntityOutput['content']

export type EntityBatch = {
  cursor: string
  entities: EntityForm[]
}

export type Entity = {
  type: string
  content: AnyEntityContent
  revision: Revision
}

export type EntityFormContent = Omit<AnyEntityContent, 'revisionId'>

export type EntityForm = EntityInput & {
  revision?: RevisionForm
}

export type RevisionForm = {
  uid?: string
  type?: string
  datasource?: string
  created?: Date
  alternativeIds?: string[]
}
