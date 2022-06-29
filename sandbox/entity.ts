import  {
  ContentItem,
  ContentGrouping,
  MediaAsset,
} from './prisma.js'
import { RID, UID } from './shared.js'

export { ContentItem, MediaAsset, ContentGrouping }

export type Revision = {
  uid: UID,
  rid: RID,
  entityType: string,
  parentRevision: string,
}

export type EntityBatch = {
  cursor: string,
  entities: Entity[]
}

export type Entity = ContentItem | MediaAsset | ContentGrouping
