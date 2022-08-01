import { ContentItem } from '@prisma/client'
export type ContentItemInput = ContentItem & {
  mediaAssets: string[]
}
