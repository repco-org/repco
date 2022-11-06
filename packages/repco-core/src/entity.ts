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

export type FullEntity = repco.EntityInputWithUid & {
  revision: Revision
}

export type EntityMaybeContent<T extends boolean = true> = T extends true
  ? FullEntity
  : T extends false
  ? Omit<FullEntity, 'content'>
  : never

export type EntityRevision = repco.EntityOutput & {
  revision: Revision
}
