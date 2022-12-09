// A datasource that uses the Wordpress API of https://cba.media

import * as zod from 'zod'
import { form } from 'repco-prisma'
import { fetch } from 'undici'
import { CbaCategory, CbaPost, CbaSeries, CbaTag } from './cba/types.js'
import {
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
  FetchUpdatesResult,
  SourceRecordForm,
} from '../datasource.js'
import { ConceptKind, ContentGroupingVariant, EntityForm } from '../entity.js'
import { FetchOpts } from '../util/datamapping.js'
import { HttpError } from '../util/error.js'

const DEFAULT_ENDPOINT = 'https://cba.fro.at/wp-json/wp/v2'

const CONTENT_TYPE_JSON = 'application/json'

// series:
// https://cba.fro.at/wp-json/wp/v2/series?page=1&per_page=1&_embed&orderby=modified&order=asc&modified_after=2021-07-27T10:29:04
// stations:
// https://cba.fro.at/wp-json/wp/v2/station
// https://cba.fro.at/wp-json/wp/v2/station?modified_after=2010-07-27T10:29:04&per_page=1&orderby=modified&order=asc
// alernativ channel
// https://cba.fro.at/wp-json/wp/v2/channel
// channels:
// posts:
// https://cba.fro.at/wp-json/wp/v2/posts

export type FormsWithUid = {
  uid: string
  entities: EntityForm[]
}

const configSchema = zod.object({
  endpoint: zod.string().url().optional(),
  apiKey: zod.string().optional(),
})
type ConfigSchema = zod.infer<typeof configSchema>

export class CbaDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new CbaDataSource(parsedConfig)
  }
  get definition() {
    return {
      uid: 'urn:repco:datasource:cba',
      name: 'CBA',
    }
  }
}

export class CbaDataSource implements DataSource {
  endpoint: string
  endpointOrigin: string
  uriPrefix: string
  apiKey?: string
  constructor(config: ConfigSchema) {
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT
    this.apiKey = config.apiKey || process.env.CBA_API_KEY || undefined
    const endpointUrl = new URL(this.endpoint)
    this.endpointOrigin = endpointUrl.hostname
    this.uriPrefix = `repco:cba:${this.endpointOrigin}`
  }

  get config() {
    return { endpoint: this.endpoint, apiKey: this.apiKey }
  }

  get definition(): DataSourceDefinition {
    return {
      name: 'Cultural Broacasting Archive',
      uid: 'urn:datasource:cba:' + this.endpoint,
      pluginUid: 'urn:repco:datasource:cba',
    }
  }

  canFetchUri(uri: string): boolean {
    const parsed = this.parseUri(uri)
    return !!parsed
  }

  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    console.log('fetchByUri', uri)
    const parsed = this.parseUri(uri)
    if (!parsed) throw new Error('Invalid URI')
    switch (parsed.type) {
      case 'post': {
        const url = this._url(`/post/${parsed.id}`)
        const post = await this._fetch<CbaPost>(url)
        this.expandAttachements(post)
        return [
          {
            body: JSON.stringify(post),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'post',
            sourceUri: url,
          },
        ]
      }
      case 'media': {
        const url = this._url(`/media/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'media',
            sourceUri: url,
          },
        ]
      }
      case 'series': {
        const url = this._url(`/series/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'series',
            sourceUri: url,
          },
        ]
      }
      case 'category': {
        const url = this._url(`/categories/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'category',
            sourceUri: url,
          },
        ]
      }
      case 'tag': {
        const url = this._url(`/tags/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'tag',
            sourceUri: url,
          },
        ]
      }
    }
    throw new Error('Unsupported CBA data type: ' + parsed.type)
  }

  async expandAttachements(post: CbaPost) {
    post._fetchedAttachements = []
    for (const attachement of post._links['wp:attachment']) {
      const { href } = attachement
      const medias = await this._fetch(href)
      for (const media of medias) {
        post._fetchedAttachements.push(media)
      }
    }
  }

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    const cursor = cursorString ? JSON.parse(cursorString) : {}
    const records = []
    {
      let postsCursor = cursor.posts
      if (!postsCursor) postsCursor = '1970-01-01T01:00:00'
      const perPage = 2
      const url = this._url(
        `/posts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${postsCursor}`,
      )
      const posts = await this._fetch<CbaPost[]>(url)

      // fetch wp:attachement resources
      await Promise.all(posts.map((post) => this.expandAttachements(post)))

      const lastPost = posts[posts.length - 1]
      if (lastPost) cursor.posts = lastPost.modified
      records.push({
        body: JSON.stringify(posts),
        contentType: CONTENT_TYPE_JSON,
        sourceType: 'posts',
        sourceUri: url,
      })
    }

    return {
      cursor: JSON.stringify(cursor),
      records,
    }
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    const body = JSON.parse(record.body)

    switch (record.sourceType) {
      case 'post':
        return this._mapPost(body as CbaPost)
      case 'media':
        return this._mapMedia(body)
      case 'series':
        return this._mapSeries(body)
      case 'category':
        return this._mapCategory(body)
      case 'tag':
        return this._mapTag(body)
      case 'posts':
        return (body as CbaPost[]).map((post) => this._mapPost(post)).flat()
      default:
        throw new Error('Unknown source type: ' + record.sourceType)
    }
  }

  private parseUri(uri: string) {
    if (!uri.startsWith(this.uriPrefix + ':')) return null
    uri = uri.substring(this.uriPrefix.length + 1)
    const parts = uri.split(':')
    if (parts[0] === 'e') {
      if (parts.length !== 3) return null
      return {
        kind: 'entity',
        type: parts[1],
        id: parts[2],
      }
    } else if (parts[1] === 'r') {
      if (parts.length !== 4) return null
      return {
        kind: 'revision',
        type: parts[1],
        id: parts[2],
        revisionId: parts[3],
      }
    } else {
      return null
    }
  }

  private _uri(type: string, id: string | number): string {
    return `${this.uriPrefix}:e:${type}:${id}`
  }

  private _revisionUri(
    type: string,
    id: string | number,
    revisionId: string | number,
  ): string {
    return `${this.uriPrefix}:r:${type}:${id}:${revisionId}`
  }

  // private async _fetchSeriesUpdates(cursor?: string) {
  //   if (!cursor) cursor = '1970-01-01T01:00:00'
  //   const perPage = 2
  //   const url = `/series?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
  //   const series = await this._fetch<CbaSeries[]>(url)
  //
  //   return extractCursorAndMap(
  //     series,
  //     (x) => this._mapSeries(x),
  //     (x) => x.modified.toString(),
  //   )
  // }

  // private async _fetchPosts(cursor?: string) {
  //   if (!cursor) cursor = '1970-01-01T01:00:00'
  //   const perPage = 2
  //   const url = `/posts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
  //   const posts = await this._fetch<CbaPost[]>(url)
  //   const otherEntities: EntityForm[] = []
  //   if (!posts.length) return null
  //   for (const post of posts) {
  //     if (!post._links['wp:attachment'].length) continue
  //     const mediaUids = []
  //     for (const attachement of post._links['wp:attachment']) {
  //       const { href } = attachement
  //       const { uid, entities } = await this._fetchMedias(href)
  //       otherEntities.push(...entities)
  //       mediaUids.push(uid)
  //     }
  //     post.mediaAssets = mediaUids
  //   }
  //   const mappedPosts = extractCursorAndMap(
  //     posts,
  //     (x) => this._mapPost(x),
  //     (x) => x.modified.toString(),
  //   )
  //   if (mappedPosts) mappedPosts.entities.unshift(...otherEntities)
  //   return mappedPosts
  // }
  //
  // private async _fetchMedias(url: string): Promise<FormsWithUid> {
  //   url = url.replace(this.endpoint, '')
  //   const medias = await this._fetch(url)
  //   if (!medias.length) throw new Error('Media not found')
  //   const media = medias[0]
  //   return this._mapMedia(media)
  // }

  // private async _fetchMedia(id: string): Promise<FormsWithUid> {
  //   const media = await this._fetch(`/media/${id}`)
  //   return this._mapMedia(media)
  // }
  //
  // private async _fetchSeries(id: string) {
  //   const series = await this._fetch(`/series/${id}`)
  //   return this._mapSeries(series)
  // }

  private _mapMedia(media: any): EntityForm[] {
    const fileId = this._uri('file', media.id)
    const mediaId = this._uri('media', media.id)
    const details = media.media_details
    let bitrate = null
    if (details?.bitrate) bitrate = parseInt(details.bitrate)
    const file: form.FileInput = {
      // uid: fileId,
      contentUrl: media.source_url,
      bitrate,
      // additionalMetadata: null,
      codec: null,
      // contentSize: null,
      duration: details?.duration || null,
      mimeType: media.mime_type,
      cid: null,
      resolution: null,
    }
    const asset: form.MediaAssetInput = {
      // uid: mediaId,
      title: media.title.rendered,
      duration: file.duration,
      description: media.description?.rendered || null,
      mediaType: 'audio',
      File: { uri: fileId },
    }
    const fileEntity: EntityForm = {
      type: 'File',
      content: file,
      entityUris: [fileId],
    }
    const mediaEntity: EntityForm = {
      type: 'MediaAsset',
      content: asset,
      entityUris: [mediaId],
    }
    return [fileEntity, mediaEntity]
  }

  private _mapCategory(category: CbaCategory): EntityForm[] {
    const content: form.ConceptInput = {
      name: category.name,
      description: category.description,
      kind: ConceptKind.CATEGORY,
    }
    if (category.parent) {
      content.ParentConcept = { uri: this._uri('category', category.parent) }
    }
    const revisionId = this._revisionUri(
      'category',
      category.id,
      new Date().getTime(),
    )
    const uri = this._uri('category', category.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'Concept', content, ...headers }]
  }

  private _mapTag(tag: CbaTag): EntityForm[] {
    const content: form.ConceptInput = {
      name: tag.name,
      description: tag.description,
      kind: ConceptKind.TAG,
    }
    const revisionId = this._revisionUri('tag', tag.id, new Date().getTime())
    const uri = this._uri('tag', tag.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'Concept', content, ...headers }]
  }

  private _mapSeries(series: CbaSeries): EntityForm[] {
    const content: form.ContentGroupingInput = {
      title: series.title.rendered,
      description: series.content.rendered,
      groupingType: 'show',
      subtitle: null,
      summary: null,
      broadcastSchedule: null,
      startingDate: null,
      terminationDate: null,
      variant: ContentGroupingVariant.EPISODIC,
    }
    const revisionId = this._revisionUri(
      'series',
      series.id,
      new Date(series.modified).getTime(),
    )
    const uri = this._uri('series', series.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'ContentGrouping', content, ...headers }]
  }

  private _mapPost(post: CbaPost): EntityForm[] {
    const mediaAssetsAndFiles = post._fetchedAttachements
      .map((attachement) => this._mapMedia(attachement))
      .flat()
    const mediaAssetUris = mediaAssetsAndFiles
      .filter((entity) => entity.type === 'MediaAsset')
      .map((x) => x.entityUris || [])
      .flat()

    const categories = post.categories.map((cbaId) => ({
      uri: this._uri('category', cbaId),
    }))
    const tags = post.tags.map((cbaId) => ({
      uri: this._uri('tag', cbaId),
    }))

    const conceptsUris = categories.concat(tags)
    console.log('concepts', conceptsUris)
    const content: form.ContentItemInput = {
      pubDate: new Date(post.date),
      content: post.content.rendered,
      contentFormat: 'text/html',
      title: post.title.rendered,
      // licenseUid: null,
      // primaryGroupingUid: null,
      subtitle: 'missing',
      summary: post.excerpt.rendered,
      //Contributions: { uri: this_uri() },
      //AdditionalGroupings: {}
      //License
      //BroadcastEvents
      Concepts: conceptsUris,
      MediaAssets: mediaAssetUris.map((uri) => ({ uri })),
      PrimaryGrouping: { uri: this._uri('series', post.post_parent) },
    }
    const revisionId = this._revisionUri(
      'post',
      post.id,
      new Date(post.modified).getTime(),
    )
    const entityUri = this._uri('post', post.id)

    const headers = {
      revisionUris: [revisionId],
      entityUris: [entityUri],
    }
    return [
      ...mediaAssetsAndFiles,
      { type: 'ContentItem', content, ...headers },
    ]
  }

  private _url(urlString: string, opts: FetchOpts = {}) {
    const url = new URL(this.endpoint + urlString)
    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, value)
      }
      opts.params = undefined
    }
    return url.toString()
  }

  private async _fetch<T = any>(
    urlString: string,
    opts: FetchOpts = {},
  ): Promise<T> {
    const url = new URL(urlString)
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey)
    }
    const res = await fetch(url.toString(), opts)
    if (!res.ok) {
      throw await HttpError.fromResponseJson(res, url)
    }
    const json = await res.json()
    return json as T
  }
}
