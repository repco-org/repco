//********************************************************************************************************************************************* */
// The XrcbDataSourcePlugin is a class that implements the DataSourcePlugin interface,
// which allows it to be used as a plugin for the Repco data integration system.
// It provides a way to access data from the XRCB WordPress API, which exposes data about
// radio stations, podcasts, categories, and tags. The plugin allows you to specify the endpoint
// of the API and an optional API key in the configuration. It provides methods for fetching
// updates to the data, as well as for transforming the data into forms that can be used in Repco.

// Endpoints:
// WP API Basepath: https://xrcb.cat/wp-json/wp/v2
// Custom API Basepath: https://xrcb.cat/wp-json/xrcb/v1

// https://xrcb.cat/ca/wp-json/wp/v2/radios
// https://xrcb.cat/wp-json/wp/v2/radio_category
// https://xrcb.cat/wp-json/wp/v2/radio_tag
// https://xrcb.cat/wp-json/wp/v2/podcasts
// https://xrcb.cat/wp-json/wp/v2/podcast_tag
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
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
  FetchUpdatesResult,
  log,
  SourceRecordForm,
} from '../datasource.js'
import { ConceptKind, ContentGroupingVariant, EntityForm } from '../entity.js'
import { FetchOpts } from '../util/datamapping.js'
import { HttpError } from '../util/error.js'

/**
 * The default endpoint for the XRCB WordPress API.
 */
const DEFAULT_ENDPOINT = 'https://xrcb.cat/wp-json/wp/v2'

const CONTENT_TYPE_JSON = 'application/json'

export type FormsWithUid = {
  uid: string
  entities: EntityForm[]
}

/**
 * The schema for the config object for this plugin.
 */
const configSchema = zod.object({
  endpoint: zod.string().url().optional(),
  apiKey: zod.string().optional(),
})
type ConfigSchema = zod.infer<typeof configSchema>

/**
 * Creates a new instance of the plugin.
 *
 * @param config - The configuration object for the plugin.
 * @returns A new instance of the plugin.
 */
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

/**
 * A plugin for accessing data from the XRCB WordPress API
 * which maps the data to the repco RDDM.
 * The Constructer creates a new instance of the plugin.
 *
 * @param config - The configuration object for the plugin.
 * @returns A new instance of the plugin.
 */
export class XrcbDataSource extends BaseDataSource implements DataSource {
  endpoint: string
  endpointOrigin: string
  uriPrefix: string
  apiKey?: string
  constructor(config: ConfigSchema) {
    super()
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

  /**
   * Fetches data from the XRCB WordPress API by URI.
   *
   * @param uri - The URI of the data to fetch.
   * @returns An array of source record forms containing the fetched data.
   * @throws An error if the URI is invalid or if the data type is not supported.
   */

  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    const parsed = this.parseUri(uri)
    if (!parsed) {
      throw new Error('Invalid URI')
    }

    const endpointMap: { [key: string]: string } = {
      post: 'podcasts',
      series: 'podcast_programa',
      category: 'podcast_category',
      tag: 'podcast_tag',
      station: 'radios',
    }

    const { id, type } = parsed
    const endpoint = endpointMap[type]

    if (!endpoint) {
      throw new Error(
        `Unsupported data type for ${this.definition.name}: ${parsed.type}`,
      )
    }

    const url = this._url(`/${endpoint}/${id}`)
    const [body] = await Promise.all([this._fetch(url)])

    return [
      {
        body: JSON.stringify(body),
        contentType: CONTENT_TYPE_JSON,
        sourceType: type,
        sourceUri: url,
      },
    ]
  }
  /**
   * Fetches updates to the data from the XRCB WordPress API.
   *
   * @param since - The timestamp to use as the lower bound for the update search.
   * @returns An object containing the updated data and the timestamp of the latest update.
   */
  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    const cursor = cursorString ? JSON.parse(cursorString) : {}
    const { posts: postsCursor = '1970-01-01T01:00:00' } = cursor
    const perPage = 100
    const url = this._url(
      `/podcasts?page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${postsCursor}`,
    )
    try {
      const posts = await this._fetch<XrcbPost[]>(url)
      cursor.posts = posts?.[posts.length - 1]?.modified || cursor.posts
      return {
        cursor: JSON.stringify(cursor),
        records: [
          {
            body: JSON.stringify(posts),
            contentType: CONTENT_TYPE_JSON,
            sourceType: 'posts',
            sourceUri: url,
          },
        ],
      }
    } catch (error) {
      log.warn({ msg: 'XRCB datasource - error fetching updates', error })
      throw error
    }
  }

  /**
   * Maps a source record form to an array of entity forms.
   *
   * @param record - The source record form to map.
   * @returns An array of entity forms representing the data in the source record form.
   * @throws An error if the source type is unknown.
   */
  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    const body = JSON.parse(record.body)

    switch (record.sourceType) {
      case 'post':
        return this._mapPost(body as XrcbPost)
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

  private _mapCategory(
    category: XrcbCategory | undefined | null,
  ): EntityForm[] {
    if (!category) {
      log.warn('XrcbCategory is null or undefined')
      return []
    }
    const content: form.ConceptInput = {
      name: category.name,
      description: category.description || '',
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
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }
    return [{ type: 'Concept', content, headers }]
  }

  private _mapTag(tag: XrcbTag | undefined | null): EntityForm[] {
    if (!tag) {
      log.warn('XrcbTag is null or undefined')
      return []
    }
    const content: form.ConceptInput = {
      name: tag.name,
      description: tag.description || '',
      kind: ConceptKind.TAG,
      originNamespace: 'https://xrcb.cat/wp-json/wp/v2/podcast_tag',
    }
    const revisionId = this._revisionUri('tag', tag.id, new Date().getTime())
    const uri = this._uri('tag', tag.id)
    const headers = {
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }
    return [{ type: 'Concept', content, headers }]
  }

  private _mapStation(station: XrcbStation): EntityForm[] {
    try {
      const content: form.PublicationServiceInput = {
        name: station.title.rendered,
        address: '',
      }

      if (station.acf?.location?.address) {
        content.address = station.acf.location.address
      }

      const revisionId = this._revisionUri(
        'station',
        station.id,
        new Date(station.modified).getTime(),
      )
      const uri = this._uri('station', station.id)
      const headers = {
        RevisionUris: [revisionId],
        EntityUris: [uri],
      }

      return [{ type: 'PublicationService', content, headers }]
    } catch (error) {
      log.warn(`Error mapping station: ${station.id}`, error)
      return []
    }
  }

  private _mapSeries(series: XrcbPrograma | undefined | null): EntityForm[] {
    if (!series) {
      log.warn('XrcbSeries is null or undefined')
      return []
    }
    if (!series.name) {
      log.warn('Missing name for series:', series.id)
      return []
    }

    const content: form.ContentGroupingInput = {
      title: series.name,
      description: series.description || '',
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
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }
    return [{ type: 'ContentGrouping', content, headers }]
  }

  private _getConceptURIs(post: XrcbPost, defaultValue: any = null): any {
    try {
      const conceptsUris = []
      if (post.podcast_tag) {
        const tags = post.podcast_tag.map((xrcbId) => ({
          uri: this._uri('tag', xrcbId),
        }))
        conceptsUris.push(...tags)
      }
      if (post.podcast_category) {
        const categories = post.podcast_category.map((xrcbId) => ({
          uri: this._uri('category', xrcbId),
        }))
        conceptsUris.push(...categories)
      }
      return conceptsUris
    } catch (error) {
      log.warn('Error extracting concept URIs from post:', error)
      return defaultValue
    }
  }

  private _getPublicationService(post: XrcbPost, defaultValue: any): any {
    try {
      if (post.acf.radio && post.acf.radio.ID) {
        return { uri: this._uri('station', post.acf.radio.ID) }
      }
    } catch (error) {
      log.warn('Error extracting publicationService from post:', error)
      return defaultValue
    }
  }
  private _getPrimaryGrouping(post: XrcbPost, defaultValue: any = null): any {
    try {
      if (post.podcast_programa) {
        const primaryGrouping = post.podcast_programa.map((xrcbId) => ({
          uri: this._uri('series', xrcbId),
        }))[0]
        return primaryGrouping
      }
      return defaultValue
    } catch (error) {
      log.warn('Error extracting primary grouping from post:', error)
      return defaultValue
    }
  }

  /**
   * Maps a post object to an array of EntityForm objects.
   * The post Object is a Podcast Post from the xrcb API.
   * Extracts further Entities from the post and adds them to the array.
   *
   * @param post - The post object to map.
   * @returns An array of EntityForm objects that represent the post.
   */
  private _mapPost(post: XrcbPost): EntityForm[] {
    try {
      const mediaAssetUris: string[] = []
      const {
        content: { rendered: postContent = '' },
        title: { rendered: postTitle = '' },
      } = post

      return [
        ...this._mapMediaAssets(post, mediaAssetUris),
        {
          type: 'ContentItem',
          content: {
            pubDate: new Date(),
            content: postContent,
            contentFormat: 'text/html',
            title: postTitle,
            subtitle: '',
            summary: '',
            Concepts: this._getConceptURIs(post, []),
            PublicationService: this._getPublicationService(post, { uri: '' }),
            PrimaryGrouping: this._getPrimaryGrouping(post, { uri: '' }),
            MediaAssets: mediaAssetUris.map((uri) => ({ uri })),
          },
          headers: {
            EntityUris: [this._uri('post', post.id)],
            RevisionUris: [
              this._revisionUri(
                'post',
                post.id,
                new Date(post.modified).getTime(),
              ),
            ],
          },
        },
      ]
    } catch (error) {
      log.warn('Error in _mapPost:', error)
      throw error
    }
  }

  private _mapMediaAssets(
    post: XrcbPost,
    mediaAssetUris: string[],
  ): EntityForm[] {
    const mediaAssetEntities: EntityForm[] = []

    try {
      if (post.acf.file_mp3 && post.acf.file_mp3.id) {
        const fileId = this._uri('file', post.acf.file_mp3.id)
        const audioId = this._uri('audio', post.acf.file_mp3.id)

        const audioFileContent: form.FileInput = {
          contentUrl: post.acf.file_mp3.url || '',
          codec: post.acf.file_mp3.subtype || '',
          mimeType: post.acf.file_mp3.mime_type || '',
          cid: null,
        }

        const audioContent: form.MediaAssetInput = {
          title: post.acf.file_mp3.title || '',
          description: post.acf.file_mp3.description || '',
          mediaType: 'audio',
          File: { uri: fileId },
        }

        const audioFileEntity: EntityForm = {
          type: 'File',
          content: audioFileContent,
          headers: { EntityUris: [fileId] },
        }
        const audioEntity: EntityForm = {
          type: 'MediaAsset',
          content: audioContent,
          headers: { EntityUris: [audioId] },
        }
        mediaAssetEntities.push(audioFileEntity, audioEntity)
        mediaAssetUris.push(audioId)
      }
    } catch (error) {
      log.warn(`Error processing audio file: ${error}`)
    }

    try {
      if (post.acf.img_podcast && post.acf.img_podcast.ID) {
        const imageId = this._uri('image', post.acf.img_podcast.ID)
        const fileId = this._uri('imageFile', post.acf.img_podcast.ID)

        const imageFileContent: form.FileInput = {
          contentUrl: post.acf?.img_podcast?.url ?? null,
          contentSize: post.acf?.img_podcast?.filesize ?? null,
          mimeType: post.acf?.img_podcast?.mime_type ?? null,
          resolution:
            post.acf?.img_podcast.height && post.acf?.img_podcast.width
              ? `${post.acf.img_podcast.height}x${post.acf.img_podcast.width}`
              : '',
        }

        const imageContent: form.MediaAssetInput = {
          title: post.acf?.img_podcast?.title ?? '',
          mediaType: 'image',
          File: { uri: fileId },
        }

        const imageFileEntity: EntityForm = {
          type: 'File',
          content: imageFileContent,
          headers: { EntityUris: [fileId] },
        }
        const imageEntity: EntityForm = {
          type: 'MediaAsset',
          content: imageContent,
          headers: { EntityUris: [imageId] },
        }
        mediaAssetEntities.push(imageFileEntity, imageEntity)
        mediaAssetUris.push(imageId)
      }
    } catch (error) {
      log.warn(`Error processing image file: ${error}`)
    }

    return mediaAssetEntities
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
    try {
      const res = await fetch(url.toString(), opts)
      log.debug(`fetch (${res.status}, url: ${url})`)
      if (!res.ok) {
        throw await HttpError.fromResponseJson(res, url)
      }
      const json = await res.json()
      return json as T
    } catch (err) {
      log.debug(`fetch failed (url: ${url}, error: ${err})`)
      throw err
    }
  }
}
