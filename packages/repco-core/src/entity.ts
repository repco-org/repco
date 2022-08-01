import { EntityInput, EntityOutput } from 'repco-prisma/dist/generated/repco/index.js';
import  {
  ContentItem,
  ContentGrouping,
  ContentGroupingVariant,
  MediaAsset,
  Revision
} from './prisma.js'

export type { ContentItem, MediaAsset, ContentGrouping, Revision }
export { ContentGroupingVariant }
export type AnyEntityContent = EntityOutput["content"]

export type EntityBatch = {
  cursor: string,
  entities: EntityForm[]
}

export type Entity = {
  type: string,
  content: AnyEntityContent,
  revision: Revision
}

export type EntityFormContent = Omit<AnyEntityContent, "revisionId">

export type EntityForm = EntityInput & {
  revision?: RevisionForm
}

export type RevisionForm = {
  uid?: string,
  type?: string,
  datasource?: string,
  created?: Date
  alternativeIds?: string[]
}
