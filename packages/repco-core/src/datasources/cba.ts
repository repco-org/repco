import { form } from 'repco-prisma'
import * as zod from 'zod'
import { fetch } from 'undici'
import { CbaPost, CbaSeries } from './cba/types.js'
import {
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
} from '../datasource.js'
import { ContentGroupingVariant, EntityBatch, EntityForm } from '../entity.js'
import { extractCursorAndMap, FetchOpts } from '../util/datamapping.js'
import { HttpError } from '../util/error.js'

const DEFAULT_ENDPOINT = 'https://cba.fro.at/wp-json/wp/v2'

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

function parseUrn(urn: string) {
  const parts = urn.split(':')
  if (parts[0] === 'urn') parts.shift()
  if (parts[0] !== 'repco') throw new Error('Invalid repco URN')
  return {
    datasource: parts[1],
    type: parts[2],
    path: parts.slice(3).join(':'),
  }
}

const configSchema = zod.object({
  endpoint: zod.string().url().optional(),
  apiKey: zod.string().optional()
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
  apiKey?: string
  constructor(config: ConfigSchema) {
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT
    this.apiKey = config.apiKey || process.env.CBA_API_KEY || undefined
  }

  get definition(): DataSourceDefinition {
    return {
      name: 'Cultural Broacasting Archive',
      uid: 'repco:datasource:cba.media',
      pluginUid: 'urn:repco:datasource:cba',
    }
  }

  canFetchUID(uid: string): boolean {
    if (uid.startsWith('urn:repco:cba.media:')) return true
    return false
  }

  async fetchByUID(uid: string): Promise<EntityForm[]> {
    const parsed = parseUrn(uid)
    if (parsed.datasource !== 'cba.media') throw new Error('Not a CBA URN')
    switch (parsed.type) {
      case 'post': {
        const post = await this._fetch<CbaPost>(`/post/${parsed.path}`)
        const entities = this._mapPost(post)
        return entities
      }
      case 'media': {
        const media = await this._fetchMedia(parsed.path)
        return media.entities
      }
      case 'series': {
        const series = await this._fetchSeries(parsed.path)
        return series
      }
    }
    throw new Error('Unsupported CBA data type: ' + parsed.type)
  }

  async fetchUpdates(cursorString: string | null): Promise<EntityBatch> {
    const cursor = cursorString ? JSON.parse(cursorString) : {}
    const entities = []
    {
      const res = await this._fetchPosts(cursor.posts)
      if (res) {
        cursor.posts = res.cursor
        entities.push(...res.entities)
      }
    }
    {
      // const res = await this._fetchSeriesUpdates(cursor.series)
      // if (res) {
      //   cursor.series = res.cursor
      //   entities.push(...res.entities)
      // }
    }
    const batch = {
      cursor: JSON.stringify(cursor),
      entities,
    }
    return batch
  }

  private _urn(type: string, id: string | number): string {
    return `urn:repco:cba.media:${type}:${id}`
  }

  private _revisionUrn(
    type: string,
    id: string | number,
    revisionId: string | number,
  ): string {
    return `urn:repco:cba.media:revision:${type}:${id}:${revisionId}`
  }

  private async _fetchSeriesUpdates(cursor?: string) {
    if (!cursor) cursor = '1970-01-01T01:00:00'
    const perPage = 2
    const url = `/series?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
    const series = await this._fetch<CbaSeries[]>(url)

    return extractCursorAndMap(
      series,
      (x) => this._mapSeries(x),
      (x) => x.modified.toString(),
    )
  }

  private async _fetchPosts(cursor?: string) {
    if (!cursor) cursor = '1970-01-01T01:00:00'
    const perPage = 2
    const url = `/posts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
    const posts = await this._fetch<CbaPost[]>(url)
    const otherEntities: EntityForm[] = []
    if (!posts.length) return null
    for (const post of posts) {
      if (!post._links['wp:attachment'].length) continue
      const mediaUids = []
      for (const attachement of post._links['wp:attachment']) {
        const { href } = attachement
        const { uid, entities } = await this._fetchMedias(href)
        otherEntities.push(...entities)
        mediaUids.push(uid)
      }
      post.mediaAssets = mediaUids
    }
    const mappedPosts = extractCursorAndMap(
      posts,
      (x) => this._mapPost(x),
      (x) => x.modified.toString(),
    )
    if (mappedPosts) mappedPosts.entities.unshift(...otherEntities)
    return mappedPosts
  }

  private async _fetchMedias(url: string): Promise<FormsWithUid> {
    url = url.replace(this.endpoint, '')
    const medias = await this._fetch(url)
    if (!medias.length) throw new Error('Media not found')
    const media = medias[0]
    return this._mapMedia(media)
  }

  private async _fetchMedia(id: string): Promise<FormsWithUid> {
    const media = await this._fetch(`/media/${id}`)
    return this._mapMedia(media)
  }

  private async _fetchSeries(id: string) {
    const series = await this._fetch(`/series/${id}`)
    return this._mapSeries(series)
  }

  private _mapMedia(media: any): FormsWithUid {
    if (!media.source_url) throw new Error('Missing media source URL')
    const fileId = this._urn('file', media.id)
    const mediaId = this._urn('media', media.id)
    const details = media.media_details
    const file: form.FileInput = {
      // uid: fileId,
      contentUrl: media.source_url,
      bitrate: details?.bitrate || null,
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
    return {
      uid: mediaId,
      entities: [fileEntity, mediaEntity],
    }
  }

  private _mapSeries(series: CbaSeries): EntityForm[] {
    const content = {
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
    const revisionId = this._revisionUrn(
      'series',
      series.id,
      new Date(series.modified).getTime(),
    )
    const uri = this._urn('series', series.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'ContentGrouping', content, ...headers }]
  }

  private _mapPost(post: CbaPost): EntityForm[] {
    const content: form.ContentItemInput  = {
      content: post.content.rendered,
      contentFormat: 'text/html',
      title: post.title.rendered,
      // licenseUid: null,
      // primaryGroupingUid: null,
      subtitle: 'missing',
      summary: post.excerpt.rendered,
      MediaAssets: post.mediaAssets.map(uri => ({ uri })),
      PrimaryGrouping: { uri: this._urn('series', post.post_parent) }
    }
    const revisionId = this._revisionUrn(
      'post',
      post.id,
      new Date(post.modified).getTime(),
    )
    const entityUri = this._urn('post', post.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [entityUri],
    }
    return [{ type: 'ContentItem', content, ...headers }]
  }

  private async _fetch<T = any>(
    urlString: string,
    opts: FetchOpts = {},
  ): Promise<T> {
    const url = new URL(this.endpoint + urlString)
    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, value)
      }
      opts.params = undefined
    }
    if (this.apiKey) {
      url.searchParams.set('api_key', this.apiKey)
    }
    const res = await fetch(url.toString(), opts)
    if (!res.ok) {
      throw await HttpError.fromResponseJson(res)
    }
    const json = await res.json()
    return json as T
  }
}
