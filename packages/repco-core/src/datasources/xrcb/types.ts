export interface XrcbPost {
  id: number
  // publishing date
  date: Date
  date_gmt: Date
  guid: GUID
  modified: Date
  modified_gmt: Date
  slug: string
  status: PostStatusEnum
  type: XrcbPostType
  link: string
  // title of episode
  title: GUID
  // description of episode
  content: Content
  // WP user
  author: number
  template: string
  // category
  podcast_category: number[]
  // tag
  podcast_tag: number[]
  // Series episode belongs to, <podcast:season> in "podcast" Namespace
  podcast_programa: number[]
  acf: Acf
  _links: Links
}

export interface Links {
  self: About[]
  collection: About[]
  about: About[]
  author: Author[]
  'wp:attachment': About[]
  'wp:term': WpTerm[]
  curies: Cury[]
}

export interface About {
  href: string
}

export interface Author {
  embeddable: boolean
  href: string
}

export interface Cury {
  name: Name
  href: Href
  templated: boolean
}

export enum Href {
  HTTPSAPIWOrgRel = 'https://api.w.org/{rel}',
}

export enum Name {
  Wp = 'wp',
}

export interface WpTerm {
  taxonomy: Taxonomy
  embeddable: boolean
  href: string
}

export enum Taxonomy {
  PodcastCategory = 'podcast_category',
  PodcastPrograma = 'podcast_programa',
  PodcastTag = 'podcast_tag',
}

export interface Acf {
  // Radio station producing this episode or podcast which episode belongs to
  radio: Radio
  programes?: boolean | number
  etiquetes: number[]
  buenaspracticas: Buenaspractica[]
  description: string
  // attached mp3 file object
  file_mp3: FileMp3
  // episode image
  img_podcast: {
    ID: number
    id: number
    url: string
    mime_type: MIMEType
    height: number
    width: number
    title: string
    filename: string
    filesize: number
  }
  privacidad: Buenaspractica[]
  categories?: number[] | boolean
  // date of emission
  fecha_emision?: string
  // is live episode?
  live?: string
  usuari?: Usuari
}

export enum Buenaspractica {
  CA = 'ca',
  Multi = 'multi',
  Yes = 'yes',
}

export interface FileMp3 {
  ID: number
  id: number
  title: string
  filename: string
  filesize: number
  url: string
  link: string
  alt: string
  author: string
  description: string
  caption: string
  name: string
  status: FileMp3Status
  uploaded_to: number
  date: Date
  modified: Date
  menu_order: number
  mime_type: MIMEType
  type: FileMp3Type
  subtype: Subtype
  icon: string
  width?: number
  height?: number
  sizes?: Sizes
}

export enum MIMEType {
  AudioMPEG = 'audio/mpeg',
  ImageGIF = 'image/gif',
  ImageJPEG = 'image/jpeg',
  ImagePNG = 'image/png',
}

export interface Sizes {
  thumbnail: string
  'thumbnail-width': number
  'thumbnail-height': number
  medium: string
  'medium-width': number
  'medium-height': number
  medium_large: string
  'medium_large-width': number
  'medium_large-height': number
  large: string
  'large-width': number
  'large-height': number
  '1536x1536': string
  '1536x1536-width': number
  '1536x1536-height': number
  '2048x2048': string
  '2048x2048-width': number
  '2048x2048-height': number
}

export enum FileMp3Status {
  Inherit = 'inherit',
}

export enum Subtype {
  GIF = 'gif',
  JPEG = 'jpeg',
  MPEG = 'mpeg',
  PNG = 'png',
}

export enum FileMp3Type {
  Audio = 'audio',
  Image = 'image',
}

export interface Radio {
  ID: number
  post_author: string
  post_date: Date
  post_date_gmt: Date
  post_content: string
  // title of radio station producing this episode or podcast which episode belongs to
  post_title: string
  post_excerpt: string
  post_status: PostStatusEnum
  comment_status: Status
  ping_status: Status
  post_password: string
  post_name: string
  to_ping: string
  pinged: string
  post_modified: Date
  post_modified_gmt: Date
  post_content_filtered: string
  post_parent: number
  guid: string
  menu_order: number
  post_type: PostType
  post_mime_type: string
  comment_count: string
  filter: Filter
}

export enum Status {
  Closed = 'closed',
}

export enum Filter {
  Raw = 'raw',
}

export enum PostStatusEnum {
  Publish = 'publish',
}

export enum PostType {
  Radio = 'radio',
}

export interface Usuari {
  ID: number
  user_firstname: string
  user_lastname: string
  nickname: string
  user_nicename: string
  display_name: string
  user_email: string
  user_url: string
  user_registered: Date
  user_description: string
  user_avatar: string
}

export interface Content {
  rendered: string
  protected: boolean
}

export interface GUID {
  rendered: string
}

export enum XrcbPostType {
  Podcast = 'podcast',
}

export interface XrcbCategory {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  meta: any[]
  acf: any[]
  _links: XrcbCategoryLinks
}

export interface XrcbTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  meta: any[]
  acf: any[]
  _links: XrcbCategoryLinks
}

export interface XrcbCategoryLinks {
  self: any[]
  collection: any[]
  about: any[]
  'wp:post_type': any[]
  curies: any[]
}

export interface XrcbStation {
  id: number
  date: Date
  date_gmt: Date
  guid: GUID
  modified: Date
  modified_gmt: Date
  slug: string
  status: PostStatusEnum
  type: string
  link: string
  title: GUID
  author: number
  featured_media: number
  template: string
  radio_category: number[]
  radio_tag: number[]
  acf: {
    categories: number[]
    cuidad: string
    barrio: string
    sede: string
    location: {
      address: string
      name: string
      street_number: string
      street_name: string
      city: string
      state: string
      post_code: string
      country: string
    }
    web: string
    mail: string
  }
  _links: any[]
}

export interface XrcbPrograma {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  meta: any[]
  acf: {
    usuari: {
      ID: number
      user_firstname: string
      user_lastname: string
      nickname: string
      user_nicename: string
      display_name: string
      user_email: string
      user_url: string
      user_registered: Date
      user_description: string
      user_avatar: string
    }
  }
  _links: any[]
}
