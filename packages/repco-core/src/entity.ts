import  {
  ContentItem,
  ContentGrouping,
  MediaAsset,
  Revision
} from './prisma.js'

export { ContentItem, MediaAsset, ContentGrouping, Revision }

export type EntityBatch = {
  cursor: string,
  entities: Entity[]
}

export type Entity = {
  type: string,
  value: ContentItem | MediaAsset | ContentGrouping
}
