// @ts-ignore
import { fetch } from 'fetch-undici'
import { DataSource, DataSourceDefinition } from "../datasource.js";
import { EntityForm, EntityBatch, ContentItem, ContentGrouping, ContentGroupingVariant } from "../entity.js";
import { CbaPost, CbaSeries } from './cba/types.js';
import { HttpError } from '../helpers/error.js'
import { extractCursorAndMap, FetchOpts } from '../helpers/datamapping.js'
import { FileInput, MediaAssetInput } from 'repco-prisma/dist/generated/repco/index.js';

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

export class CbaDataSource implements DataSource {
  endpoint: string
  constructor () {
    this.endpoint = 'https://cba.fro.at/wp-json/wp/v2'
  }

  get definition(): DataSourceDefinition {
    return {
      name: 'Cultural Broacasting Archive',
      uid: 'repco:datasource:cba.media'
    }
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
      const res = await this._fetchSeries(cursor.series)
      if (res) {
        cursor.series = res.cursor
        entities.push(...res.entities)
      }
    }
    const batch = {
      cursor: JSON.stringify(cursor),
      entities
    }
    return batch
  }


  private _urn (type: string, id: string | number): string {
    return `urn:repco:cba.media:${type}:${id}`
  }

  private _revisionUrn (type: string, id: string | number, revisionId: string | number): string {
    return `urn:repco:cba.media:revision:${type}:${id}:${revisionId}`
  }

  private async _fetchSeries(cursor?: string) {
    if (!cursor) cursor = '1970-01-01T01:00:00'
    const perPage = 2
    const url = `/series?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
    const series = await this._fetch<CbaSeries[]>(url)

    return extractCursorAndMap(
      series,
      x => this._mapSeries(x),
      x => x.modified.toString()
    )
  }

  private async _fetchPosts(cursor?: string) {
    if (!cursor) cursor = '1970-01-01T01:00:00'
    const perPage = 2
    const url = `/posts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${cursor}`
    const posts = await this._fetch<CbaPost[]>(url)
    const otherEntities = []
    if (!posts.length) return null
    for (const post of posts) {
      if (!(post._links['wp:attachment'].length)) continue
      const mediaUids = []
      for (const attachement of post._links['wp:attachment']) {
        const { href } = attachement
        const { uid, entities } = await this._fetchMedia(href)
        otherEntities.push(...entities)
        mediaUids.push(uid)
      }
      post.mediaAssets = mediaUids
    }
    const mappedPosts = extractCursorAndMap(
      posts,
      x => this._mapPost(x),
      x => x.modified.toString()
    )
    if (mappedPosts) mappedPosts.entities.unshift(...otherEntities)
    return mappedPosts
  }

  private async _fetchMedia(url: string): Promise<{ uid: string, entities: EntityForm[] }> {
    url = url.replace(this.endpoint, '')
    const medias = await this._fetch(url)
    if (!medias.length) throw new Error('Media not found')
    const media = medias[0]
    // console.log('media', media)
    if (!media.source_url) throw new Error('Missing media source URL')
    const fileId = this._urn('file', media.id)
    const mediaId = this._urn('media', media.id)
    const details = media.media_details
    const file: FileInput = {
      uid: fileId,
      contentUrl: media.source_url,
      bitrate: (details?.bitrate) || null,
      additionalMetadata: null,
      codec: null,
      // contentSize: null,
      duration: (details?.duration) || null,
      mimeType: media.mime_type,
      multihash: null,
      resolution: null
    }
    const asset: MediaAssetInput = {
      uid: mediaId,
      fileUid: fileId,
      title: media.title.rendered,
      duration: file.duration,
      description: (media.description?.rendered) || null,
      licenseUid: null,
      mediaType: 'audio',
      teaserImageUid: null
    }
    const fileEntity: EntityForm = { type: 'File', content: file }
    const mediaEntity: EntityForm = { type: 'MediaAsset', content: asset }
    return {
      uid: mediaId,
      entities: [fileEntity, mediaEntity]
    }
  }

  private _mapSeries(series: CbaSeries): EntityForm[] {
    const content = {
      uid: this._urn('series', series.id),
      title: series.title.rendered,
      description: series.content.rendered,
      licenseUid: null,
      groupingType: 'show',
      subtitle: null,
      summary: null,
      broadcastSchedule: null,
      startingDate: null,
      terminationDate: null,
      variant: ContentGroupingVariant.EPISODIC
    }
    const revisionId = this._revisionUrn("series", series.id, new Date(series.modified).getTime())
    const revision = {
      alternativeIds: [revisionId]
    }
    return [{ type: 'ContentGrouping', content, revision }]
  }

  private _mapPost(post: CbaPost): EntityForm[] {
    const content = {
      uid: this._urn('post', post.id),
      content: post.content.rendered,
      contentFormat: 'text/html',
      title: post.title.rendered,
      licenseUid: null,
      primaryGroupingUid: null,
      subtitle: 'missing',
      summary: post.excerpt.rendered,
      mediaAssets: post.mediaAssets
    }
    const revisionId = this._revisionUrn("post", post.id, new Date(post.modified).getTime())
    const revision = {
      alternativeIds: [revisionId]
    }
    return [{ type: 'ContentItem', content, revision }]
  }

  private async _fetch<T = any>(urlString: string, opts: FetchOpts = {}): Promise<T> {
    const url = new URL(this.endpoint + urlString)
    console.log(process.env.CBA_API_KEY)
    if (opts.params) {
      for (const [key, value] of Object.entries(opts.params)) {
        url.searchParams.set(key, value)
      }
      opts.params = undefined
    }
    if (process.env.CBA_API_KEY) {
      url.searchParams.set('api_key', 'k8WHfNbal0rjIs2f')
    }
    console.log('FETCH', url.toString())
    const res = await fetch(url.toString(), opts)
    if (!res.ok) {
      try {
        const errorJson = await res.json()
        throw new HttpError(res.code, errorJson.message, errorJson)
      } catch (err) {
        if (err instanceof HttpError) throw err
        else throw HttpError.fromResponse(res)
      }
    }
    const json = await res.json()
    return json as T
  }
}
