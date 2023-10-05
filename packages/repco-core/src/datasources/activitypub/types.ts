//typescript types for the cba datasource

export interface OutBox {
  id: number
  type: string
  totalItems: number
  first: string
}

interface Activity {
  type: string
  id: string
  actor: string
  object: string | VideoObject
  to: string[]
  cc: string[]
}

export interface Page {
  id: string
  type: string
  next?: string
  partOf: string
  orderedItems: Activity[]
  totalitems: number
}

export interface ActivityHashTagObject {
  type: 'Hashtag'
  href?: string
  name: string
}

export interface ActivityIdentifierObject {
  identifier: string
  name: string
  url?: string
}

export interface ActivityIconObject {
  type: 'Image'
  url: string
  mediaType: string
  width?: number
  height?: number
}

export interface ActivityVideoUrlObject {
  type: 'Link'
  mediaType: 'video/mp4' | 'video/webm' | 'video/ogg'
  href: string
  height: number
  size: number
  fps: number
}

export interface ActivityHtmlUrlObject {
  type: 'Link'
  mediaType: 'text/html'
  href: string
}

export interface ActivityVideoFileMetadataUrlObject {
  type: 'Link'
  rel: string[]
  mediaType: 'application/json'
  height: number
  href: string
  fps: number
}

export type ActivityUrlObject =
  | ActivityVideoUrlObject
  | ActivityHtmlUrlObject
  | ActivityVideoFileMetadataUrlObject

export type ActivityPubAttributedTo =
  | string
  | { type: 'Group' | 'Person'; id: string }

export interface VideoObject {
  type: string
  id: string
  name: string
  duration: string
  uuid: string
  tag: ActivityHashTagObject[]
  category?: ActivityIdentifierObject
  licence?: ActivityIdentifierObject
  language?: ActivityIdentifierObject
  subtitleLanguage?: ActivityIdentifierObject[]
  views: number
  sensitive: boolean
  published: Date
  originallyPublishedAt?: string
  updated: Date
  uploadDate: string
  mediaType: 'text/markdown'
  content: string
  support: string
  icon?: ActivityIconObject[]
  url: ActivityUrlObject[]
  attributedTo: ActivityPubAttributedTo[]
}
