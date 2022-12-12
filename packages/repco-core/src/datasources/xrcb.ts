//********************************************************************************************************************************************* */
// TO DO: add contributions - right now there is a problem with fetching the /users endpoint but I don't know why - there are authors and editors
// TO DO: don't know what to do with the Station may we use it as additional Grouping, add them as Contribution or make a schema change so Contentitems are in relation with publischingServices
// TO DO: License has no endpoint not sure how we should handle this, medias have a license but not the contentitems

// Some Notes:

// WP API Basepath: https://xrcb.cat/wp-json/wp/v2
// Custom API Basepath: https://xrcb.cat/wp-json/xrcb/v1

// Die StandardAPI sollte funktionieren, alle von uns definierten Felder werden unter "acf" exposed. Intern (web und app) verwenden wir aber nur die selbstgebaute. Leider haben wir keine aktuelle Doku (nur ein kleines UML: https://guifi-exo.gitlab.io/xrcb/xrcb-docs/dev/dev_wordpress/#uml-diagram), und blöderweisse haben auch viele felder katalanische Namen, die muss ich dir wahrscheinlich übersetzen.

// Folgendermassen kommst du an die Daten:

// 1. Entpoint Radios, was in Neusprech Podcasts entspricht: https://xrcb.cat/ca/wp-json/xrcb/v1/radios

// (Oder alternativ über unsere API, da heissen halt die felder etwas anders: https://xrcb.cat/ca/wp-json/wp/v2/radios)

// 2. Radios haben categories und taxonomies:
// https://xrcb.cat/wp-json/wp/v2/radio_category
// https://xrcb.cat/wp-json/wp/v2/radio_tag

// 3. Mit der Radio ID kommst du zu den einzelnen Episoden, die bei uns verwirrenderweise Podcasts heissen. Am einfachsten über https://xrcb.cat/ca/wp-json/xrcb/v1/podcasts?radio_id=<radio_id>

// (Alternativ über die standard API, die radio_id ist unter acf.radio.ID: https://xrcb.cat/wp-json/wp/v2/podcasts)

// 4. Podcasts haben categories und taxonomies:
// https://xrcb.cat/wp-json/wp/v2/podcast_category
// https://xrcb.cat/wp-json/wp/v2/podcast_tag

// 5. Podcasts können auch zu einem Programm gehören, das wäre etwa sowas wie
// <podcast:season>:
// https://xrcb.cat/wp-json/wp/v2/podcast_programa

//********************************************************************************************************************************************* */

import * as zod from 'zod'
import { form } from 'repco-prisma'
import { fetch } from 'undici'
import {
  XrcbCategory,
  XrcbPost,
  XrcbPrograma,
  XrcbStation,
  XrcbTag,
} from './xrcb/types.js'
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

// Endpoint of the Datasource
const DEFAULT_ENDPOINT = 'https://xrcb.cat/wp-json/wp/v2'

const CONTENT_TYPE_JSON = 'application/json'

export type FormsWithUid = {
  uid: string
  entities: EntityForm[]
}

const configSchema = zod.object({
  endpoint: zod.string().url().optional(),
  apiKey: zod.string().optional(),
})
type ConfigSchema = zod.infer<typeof configSchema>

export class XrcbDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new XrcbDataSource(parsedConfig)
  }
  get definition() {
    return {
      uid: 'urn:repco:datasource:xrcb',
      name: 'XRCB',
    }
  }
}

export class XrcbDataSource implements DataSource {
  endpoint: string
  endpointOrigin: string
  uriPrefix: string
  apiKey?: string
  constructor(config: ConfigSchema) {
    this.endpoint = config.endpoint || DEFAULT_ENDPOINT
    this.apiKey = config.apiKey || process.env.XRCB_API_KEY || undefined
    const endpointUrl = new URL(this.endpoint)
    this.endpointOrigin = endpointUrl.hostname
    this.uriPrefix = `repco:xrcb:${this.endpointOrigin}`
  }

  get config() {
    return { endpoint: this.endpoint, apiKey: this.apiKey }
  }

  get definition(): DataSourceDefinition {
    return {
      name: 'Xarxa de Ràdio Comunitària de Barcelona',
      uid: 'urn:datasource:xrcb:' + this.endpoint,
      pluginUid: 'urn:repco:datasource:xrcb',
    }
  }

  canFetchUri(uri: string): boolean {
    const parsed = this.parseUri(uri)
    return !!parsed
  }

  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    const parsed = this.parseUri(uri)
    if (!parsed) throw new Error('Invalid URI')
    switch (parsed.type) {
      case 'post': {
        const url = this._url(`/podcasts/${parsed.id}`)
        const podcast = await this._fetch<XrcbPost>(url)
        return [
          {
            body: JSON.stringify(podcast),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'post',
            sourceUri: url,
          },
        ]
      }
      case 'station': {
        const url = this._url(`/radios/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'station',
            sourceUri: url,
          },
        ]
      }
      case 'series': {
        const url = this._url(`/podcast_programa/${parsed.id}`)
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
        const url = this._url(`/podcast_category/${parsed.id}`)
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
        const url = this._url(`/podcast_tags/${parsed.id}`)
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
      case 'audio': {
        const url = this._url(`/podcasts/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'audio',
            sourceUri: url,
          },
        ]
      }
      case 'image': {
        const url = this._url(`/podcasts/${parsed.id}`)
        const body = await this._fetch(url)
        return [
          {
            body: JSON.stringify(body),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'image',
            sourceUri: url,
          },
        ]
      }
    }
    throw new Error('Unsupported XRCB data type: ' + parsed.type)
  }

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    const cursor = cursorString ? JSON.parse(cursorString) : {}
    const records = []
    {
      let postsCursor = cursor.posts
      if (!postsCursor) postsCursor = '1970-01-01T01:00:00'
      const perPage = 2
      const url = this._url(
        `/podcasts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${postsCursor}`,
      )
      const posts = await this._fetch<XrcbPost[]>(url)

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
        return this._mapPost(body as XrcbPost)
      case 'audio':
        return this._mapAudio(body)
      // case 'image':
      //   return this._mapImage(body)
      case 'series':
        return this._mapSeries(body)
      case 'category':
        return this._mapCategory(body)
      case 'tag':
        return this._mapTag(body)
      case 'posts':
        return (body as XrcbPost[]).map((post) => this._mapPost(post)).flat()
      case 'station':
        return this._mapStation(body)

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

  private _mapAudio(media: XrcbPost): EntityForm[] {
    const fileId = this._uri('file', media.acf.file_mp3.ID)
    const audioId = this._uri('audio', media.acf.file_mp3.ID)

    const file: form.FileInput = {
      contentUrl: media.acf.file_mp3.url,
      codec: media.acf.file_mp3.subtype,
      mimeType: media.acf.file_mp3.mime_type,
      cid: null,
    }
    const asset: form.MediaAssetInput = {
      title: media.acf.file_mp3.title,
      description: media.acf.file_mp3.description,
      mediaType: 'audio',
      //License: null,
      //Contribution
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
      entityUris: [audioId],
    }
    return [fileEntity, mediaEntity]
  }

  private _mapImage(media: XrcbPost): EntityForm[] {
    const fileId = this._uri('file', media.acf.img_podcast.ID)
    const imageId = this._uri('image', media.acf.img_podcast.ID)

    const file: form.FileInput = {
      contentUrl: media.acf.img_podcast.url,
      contentSize: media.acf.img_podcast.filesize,
      mimeType: media.acf.img_podcast.mime_type,
      resolution:
        media.acf.img_podcast.height.toString() +
        'x' +
        media.acf.img_podcast.width.toString(),
    }
    const asset: form.MediaAssetInput = {
      title: media.acf.img_podcast.title,
      mediaType: 'image',

      //License: null,
      //Contribution
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
      entityUris: [imageId],
    }
    return [fileEntity, mediaEntity]
  }

  private _mapCategory(category: XrcbCategory): EntityForm[] {
    const content: form.ConceptInput = {
      name: category.name,
      description: category.description,
      kind: ConceptKind.CATEGORY,
      originNamespace: 'https://xrcb.cat/wp-json/wp/v2/podcast_category',
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

  private _mapTag(tag: XrcbTag): EntityForm[] {
    const content: form.ConceptInput = {
      name: tag.name,
      description: tag.description,
      kind: ConceptKind.TAG,
      originNamespace: 'https://xrcb.cat/wp-json/wp/v2/podcast_tag',
    }
    const revisionId = this._revisionUri('tag', tag.id, new Date().getTime())
    const uri = this._uri('tag', tag.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'Concept', content, ...headers }]
  }

  private _mapStation(station: XrcbStation): EntityForm[] {
    const content: form.PublicationServiceInput = {
      name: station.title.rendered,
      address: station.acf.location.address,
    }
    const revisionId = this._revisionUri(
      'station',
      station.id,
      new Date(station.modified).getTime(),
    )
    const uri = this._uri('station', station.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'PublicationService', content, ...headers }]
  }

  private _mapSeries(series: XrcbPrograma): EntityForm[] {
    const content: form.ContentGroupingInput = {
      title: series.name,
      description: series.description,
      variant: ContentGroupingVariant.SERIAL,
      groupingType: 'series',
    }
    const revisionId = this._revisionUri(
      'series',
      series.id,
      new Date().getTime(),
    )
    const uri = this._uri('series', series.id)
    const headers = {
      revisionUris: [revisionId],
      entityUris: [uri],
    }
    return [{ type: 'ContentGrouping', content, ...headers }]
  }

  private _mapPost(post: XrcbPost): EntityForm[] {
    // const mediaAssetUris = []
    // const mediaAssetAudio = { uri: this._uri('audio', post.acf.file_mp3.ID) }
    // if (post.acf.img_podcast) {
    //   const mediaAssetImage = {
    //     uri: this._uri('image', post.acf.img_podcast.ID),
    //   }
    //   mediaAssetUris.push(mediaAssetImage)
    // }
    // mediaAssetUris.push(mediaAssetAudio)
    const mediaAssetUris = [
      { uri: this._uri('audio', post.id) },
      //{ uri: this._uri('image', post.id) },
    ]
    const conceptsUris = []
    const tags = post.podcast_tag.map((xrcbId) => ({
      uri: this._uri('tag', xrcbId),
    }))
    const categories = post.podcast_category.map((xrcbId) => ({
      uri: this._uri('category', xrcbId),
    }))

    conceptsUris.push(...tags)
    conceptsUris.push(...categories)

    const station = { uri: this._uri('station', post.acf.radio.ID) }

    const primaryGroupingUris = []
    const primaryGrouping = post.podcast_programa.map((xrcbId) => ({
      uri: this._uri('series', xrcbId),
    }))
    primaryGroupingUris.push(...primaryGrouping)

    const content: form.ContentItemInput = {
      pubDate: new Date(post.date),
      content: post.content.rendered,
      contentFormat: 'text/html',
      title: post.title.rendered,
      // licenseUid: null,
      // primaryGroupingUid: null,
      subtitle: 'missing',
      summary: 'misisng',
      //Contributions: { uri: this._uri('contributer', ) },
      // AdditionalGroupings: station,
      //License
      //BroadcastEvents
      Concepts: conceptsUris,
      MediaAssets: mediaAssetUris,
      PrimaryGrouping: primaryGroupingUris[0],
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
    return [{ type: 'ContentItem', content, ...headers }]
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
