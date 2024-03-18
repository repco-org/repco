//********************************************************************************************************************************************* */
// The CbaDataSourcePlugin is a class that implements the DataSourcePlugin interface,
// which allows it to be used as a plugin for the Repco data integration system.
// It provides a way to access data from the CBA WordPress API, which exposes data about
// radio stations, podcasts, categories, and tags and so on. The plugin allows you to specify the endpoint
// of the API and an optional API key in the configuration. It provides methods for fetching
// updates to the data, as well as for transforming the data into forms that can be used in Repco.

// Endpoints e.g.:
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

//********************************************************************************************************************************************* */

import * as zod from 'zod'
import { form } from 'repco-prisma'
import { fetch } from 'undici'
import {
  CbaAudio,
  CbaCategory,
  CbaImage,
  CbaPost,
  CbaSeries,
  CbaStation,
  CbaTag,
} from './cba/types.js'
import {
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
import { notEmpty } from '../util/misc.js'

const CONTENT_TYPE_JSON = 'application/json'

export type FormsWithUid = {
  uid: string
  entities: EntityForm[]
}

const configSchema = zod.object({
  endpoint: zod.string().url().optional(),
  apiKey: zod.string().or(zod.null()).optional(),
  pageLimit: zod.number().int().optional(),
  repo: zod.string(),
})

type ConfigSchema = zod.infer<typeof configSchema>
type FullConfigSchema = ConfigSchema & { endpoint: string; pageLimit: number }

const DEFAULT_CONFIG: FullConfigSchema = {
  endpoint: 'https://cba.fro.at/wp-json/wp/v2',
  pageLimit: 30,
  apiKey: process.env.CBA_API_KEY,
  repo: 'default',
}

/**
 * A plugin for the CbaDataSource class, which implements the DataSourcePlugin interface.
 */
export class CbaDataSourcePlugin implements DataSourcePlugin {
  /**
   * Creates an instance of the CbaDataSource class, initialized with the given configuration.
   * @param config The configuration object to use for creating the CbaDataSource instance.
   * @returns An instance of the CbaDataSource class.
   */
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new CbaDataSource(parsedConfig)
  }

  /**
   * Returns the definition of the plugin.
   * @returns An object containing the `uid` and `name` of the plugin.
   */
  get definition() {
    return {
      uid: 'repco:datasource:cba',
      name: 'CBA',
    }
  }
}

export class CbaDataSource implements DataSource {
  config: FullConfigSchema
  endpointOrigin: string
  uriPrefix: string
  repo: string
  constructor(config: Partial<ConfigSchema>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    const endpointUrl = new URL(this.endpoint)
    this.endpointOrigin = endpointUrl.hostname
    this.uriPrefix = `repco:cba:${this.endpointOrigin}`
    this.repo = this.config.repo
  }

  get endpoint() {
    return this.config.endpoint
  }

  get definition(): DataSourceDefinition {
    return {
      name: 'Cultural Broacasting Archive',
      uid: `repco:${this.repo}:datasource:cba:` + this.endpoint,
      pluginUid: 'repco:datasource:cba',
    }
  }

  canFetchUri(uri: string): boolean {
    const parsed = this.parseUri(uri)
    return !!parsed
  }

  // Fetch a list of URIs in batches
  async fetchByUriBatch(uris: string[]): Promise<SourceRecordForm[]> {
    // Map of (source record type) -> (batch endpoint)
    const batchEndpoints: Record<string, string> = {
      post: 'post',
      audio: 'media',
      image: 'media',
      categories: 'categories',
      tags: 'tags',
      // @deprecated
      tag: 'tags',
      station: 'station',
      series: 'series',
    }

    // Buckets per batch endpoint
    const buckets: Record<
      string,
      { type: string; ids: { uri: string; id: string }[] }
    > = {}
    // URIs without batch support
    const unbatched = []

    // Iterate over URIs, parse them, and sort into the correct bucket
    for (const uri of uris) {
      const parsed = this.parseUri(uri)
      if (!parsed) continue
      const { id, type } = parsed
      const batchEndpoint = batchEndpoints[type]
      if (batchEndpoint) {
        if (!buckets[batchEndpoint]) buckets[batchEndpoint] = { type, ids: [] }
        buckets[batchEndpoint].ids.push({ uri, id })
      } else {
        unbatched.push(uri)
      }
    }

    // Map each endpoint bucket to list of promises.
    // Each promise in the list fetches a slice of the overall URLs (to respect page limits)
    // Collect the list of all bucket promises in a single promise.
    const batchedPromises: Promise<SourceRecordForm[][]> = Promise.all(
      Object.entries(buckets).map(async ([endpoint, { type, ids }]) => {
        try {
          let idx = 0
          const pageLimit = this.config.pageLimit
          const res = []
          while (idx < ids.length) {
            const slice = ids.slice(idx, idx + pageLimit)
            idx += slice.length
            const params = new URLSearchParams()
            params.append('include', slice.map((id) => id.id).join(','))
            params.append('per_page', slice.length.toString())
            var multilingual = ''
            if (
              endpoint === 'post' ||
              endpoint === 'series' ||
              endpoint === 'station'
            ) {
              multilingual = '&multilingual'
            }
            const url = this._url(`/${endpoint}?${params}${multilingual}`)
            const bodies = await this._fetch(url)
            res.push(
              ...bodies.map((body: any, i: number) => {
                const uri = slice[i].uri
                return {
                  body: JSON.stringify(body),
                  contentType: CONTENT_TYPE_JSON,
                  sourceType: type,
                  sourceUri: uri,
                }
              }),
            )
          }
          return res
        } catch (error) {
          // TODO: Persist the error.
          log.warn({ msg: `CBA datasource failure`, error })
          return []
        }
      }),
    )
    // Map the URIs without batch support to a promise that resolves this URI.
    // Combine them all in a single promise.
    const unbatchedPromises = Promise.all(
      unbatched.map((uri) => this.fetchByUri(uri)),
    )

    // Resolve all pending promises-of-promises in a single call
    const [batchedRes, unbatchedRes] = await Promise.all([
      batchedPromises,
      unbatchedPromises,
    ])

    // Flatten the paged arrays
    return [...batchedRes.flat(), ...unbatchedRes.flat()]
  }

  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    const parsed = this.parseUri(uri)
    if (!parsed) {
      throw new Error('Invalid URI')
    }

    const endpointMap: { [key: string]: string } = {
      post: 'post',
      audio: 'media',
      image: 'media',
      categories: 'categories',
      tags: 'tags',
      station: 'station',
      series: 'series',
    }

    const { id, type } = parsed
    const endpoint = endpointMap[type]

    if (!endpoint) {
      throw new Error(
        `Unsupported data type for ${this.definition.name}: ${parsed.type}`,
      )
    }

    var params = ''
    if (
      endpoint === 'post' ||
      endpoint === 'series' ||
      endpoint === 'station'
    ) {
      params = '?multilingual'
    }
    const url = this._url(`/${endpoint}/${id}${params}`)
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
   * Expands the attachment links for a given post and stores the attachment media in the post object.
   *
   * @param post The post for which to expand the attachment links.
   */
  async expandAttachments(posts: CbaPost[]) {
    const links = posts
      .map((post) =>
        post._links['wp:attachment'].map(
          (link) => [post.id, new URL(link.href)] as const,
        ),
      )
      .flat()

    const parents: [string, string][] = []
    const other = []
    for (const [postId, link] of links) {
      if (
        link.pathname === '/wp-json/wp/v2/media' &&
        link.searchParams.has('parent')
      ) {
        const parent = link.searchParams.get('parent')
        if (parent) parents.push([link.toString(), parent])
      } else {
        other.push([postId, link.toString()] as const)
      }
    }
    const params = new URLSearchParams()
    params.append('parent', parents.map((id) => id[1]).join(','))
    params.append('per_page', '100')
    const url = this._url(`/media?${params}`)
    const fetched = (await this._fetch(url)) as CbaAudio[]
    const res: Record<number, CbaAudio[]> = {}
    fetched.forEach((body) => {
      if (!res[body.post]) res[body.post] = []
      res[body.post].push(body)
    })
    if (other.length) {
      await Promise.all(
        other.map(async ([postId, link]) => {
          const fetched = await this._fetch(link)
          if (!res[postId]) res[postId] = []
          res[postId].push(fetched)
        }),
      )
    }
    for (const post of posts) {
      if (!post._fetchedAttachements) post._fetchedAttachements = []
      if (res[post.id]) {
        post._fetchedAttachements.push(...res[post.id])
      }
    }
  }

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    try {
      const cursor = cursorString ? JSON.parse(cursorString) : {}
      const { posts: postsCursor = '1970-01-01T01:00:00' } = cursor
      const perPage = this.config.pageLimit
      const url = this._url(
        `/posts?multilingual&page=1&per_page=${perPage}&_embed&orderby=modified&order=asc&modified_after=${postsCursor}`,
      )
      const posts = await this._fetch<CbaPost[]>(url)

      await this.expandAttachments(posts)

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
      console.error(`Error fetching updates: ${error}`)
      throw error
    }
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    try {
      const body = JSON.parse(record.body)

      switch (record.sourceType) {
        case 'post':
          return this._mapPost(body as CbaPost)
        case 'audio':
          return this._mapAudio(body)
        case 'image':
          return this._mapImage(body)
        case 'series':
          return this._mapSeries(body)
        case 'categories':
          return this._mapCategories(body)
        case 'tags':
          return this._mapTags(body)
        case 'posts':
          return (body as CbaPost[]).map((post) => this._mapPost(post)).flat()
        case 'station':
          return this._mapStation(body)

        default:
          throw new Error('Unknown source type: ' + record.sourceType)
      }
    } catch (error) {
      throw new Error(`Error body undefined: ${error}`)
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

  private _uriLink(type: string, id: string | number): { uri: string } | null {
    if (id === undefined || id === null) return null
    return { uri: this._uri(type, id) }
  }

  private _revisionUri(
    type: string,
    id: string | number,
    revisionId: string | number,
  ): string {
    return `${this.uriPrefix}:r:${type}:${id}:${revisionId}`
  }

  // _getAudioSrc(htmlString: string): string {
  //   const regex = /src="([^"]*)"/i
  //   const match = regex.exec(htmlString)
  //   if (match && match[1]) {
  //     return match[1]
  //   }
  //   throw new Error('Src attribute not found in description.')
  // }

  private _mapAudio(media: CbaAudio): EntityForm[] {
    const fileId = this._uri('file', media.id)
    const audioId = this._uri('audio', media.id)

    if (!media.source_url) {
      return []
      // throw new Error('Media source URL is missing.')
    }

    //const contentSource_url = this._getAudioSrc(media.description.rendered)
    if (!media.media_details) {
      throw new Error('Media details are missing.')
    }

    let duration = null
    if (media.media_details?.length !== undefined) {
      if (typeof media.media_details.length === 'number') {
        duration = media.media_details.length
      } else if (typeof media.media_details.length === 'string') {
        duration = parseFloat(media.media_details.length)
      }
    }
    const file: form.FileInput = {
      contentUrl: media.source_url,
      bitrate: media.media_details.bitrate
        ? Math.round(media.media_details.bitrate)
        : undefined,
      codec: media.media_details.codec,
      duration,
      mimeType: media.mime_type || null,
      cid: null,
      resolution: null,
    }

    var titleJson: { [k: string]: any } = {}
    titleJson[media.language_codes[0]] = { value: media.title.rendered }
    var descriptionJson: { [k: string]: any } = {}
    descriptionJson[media.language_codes[0]] = {
      value: media.description?.rendered,
    }

    Object.entries(media.translations).forEach((entry) => {
      titleJson[entry[1]['language']] = { value: entry[1]['title'] }
      descriptionJson[entry[1]['language']] = { value: entry[1]['description'] }
    })

    const asset: form.MediaAssetInput = {
      title: titleJson,
      description: descriptionJson,
      mediaType: 'audio',
      duration,
      Concepts: media.media_tag.map((cbaId) => ({
        uri: this._uri('tags', cbaId),
      })),
      Files: [{ uri: fileId }],
    }

    const licenseEntity = this._mapLicense(
      `${media.license.license}${media.license.version}`,
    )

    const fileEntity: EntityForm = {
      type: 'File',
      content: file,
      headers: { EntityUris: [fileId] },
    }

    const mediaEntity: EntityForm = {
      type: 'MediaAsset',
      content: asset,
      headers: { EntityUris: [audioId] },
    }
    var transcripts: Array<EntityForm> = []
    if (media.transcripts.length > 0) {
      transcripts = this._mapTranscripts(media, media.transcripts, {
        uri: audioId,
      })
    }

    return [fileEntity, mediaEntity, licenseEntity, ...transcripts]
  }

  private _mapImage(media: CbaImage): EntityForm[] {
    const fileId = this._uri('file', media.id)
    const imageId = this._uri('image', media.id)

    if (!media.source_url) {
      throw new Error('Media source URL is missing.')
    }

    if (!media.media_details) {
      throw new Error('Media details are missing.')
    }

    const file: form.FileInput = {
      contentUrl: media.source_url,
      contentSize: media.media_details.filesize || null,
      mimeType: media.mime_type,
      resolution: null,
    }

    if (media.media_details.width && media.media_details.height) {
      file.resolution =
        media.media_details.height.toString() +
        'x' +
        media.media_details.width.toString()
    }

    var titleJson: { [k: string]: any } = {}
    titleJson[media.language_codes[0]] = { value: media.title.rendered }
    var descriptionJson: { [k: string]: any } = {}
    descriptionJson[media.language_codes[0]] = {
      value: media.description?.rendered,
    }

    Object.entries(media.translations).forEach((entry) => {
      titleJson[entry[1]['language']] = { value: entry[1]['title'] }
      descriptionJson[entry[1]['language']] = { value: entry[1]['description'] }
    })

    const asset: form.MediaAssetInput = {
      title: titleJson,
      description: descriptionJson,
      mediaType: 'image',
      Concepts: media.media_tag.map((cbaId) => ({
        uri: this._uri('tags', cbaId),
      })),
      Files: [{ uri: fileId }],
    }

    const fileEntity: EntityForm = {
      type: 'File',
      content: file,
      headers: { EntityUris: [fileId] },
    }

    const mediaEntity: EntityForm = {
      type: 'MediaAsset',
      content: asset,
      headers: { EntityUris: [imageId] },
    }

    var transcripts = this._mapTranscripts(media, media.transcripts, {
      uri: imageId,
    })

    return [fileEntity, mediaEntity, ...transcripts]
  }

  private _mapCategories(categories: CbaCategory): EntityForm[] {
    //TODO: find language code
    var nameJson: { [k: string]: any } = {}
    nameJson['de'] = { value: categories.name }
    var descriptionJson: { [k: string]: any } = {}
    descriptionJson['de'] = { value: categories.description }
    var summaryJson: { [k: string]: any } = {}
    summaryJson['de'] = { value: categories.description }

    const content: form.ConceptInput = {
      name: nameJson,
      description: descriptionJson,
      kind: ConceptKind.CATEGORY,
      originNamespace: 'https://cba.fro.at/wp-json/wp/v2/categories',
      summary: summaryJson,
    }
    if (categories.parent !== undefined) {
      content.ParentConcept = {
        uri: this._uri('categories', categories.parent),
      }
    }
    const revisionId = this._revisionUri(
      'categories',
      categories.id,
      new Date().getTime(),
    )
    const uri = this._uri('categories', categories.id)
    const headers = {
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }
    return [{ type: 'Concept', content, headers }]
  }

  private _mapTags(tags: CbaTag): EntityForm[] {
    if (!tags || !tags.name || !tags.id) {
      console.error('Invalid tags input.')
      throw new Error('Invalid tags input.')
    }

    //TODO: find language code
    var nameJson: { [k: string]: any } = {}
    nameJson['de'] = { value: tags.name }
    var descriptionJson: { [k: string]: any } = {}
    descriptionJson['de'] = { value: tags.description }
    var summaryJson: { [k: string]: any } = {}
    summaryJson['de'] = { value: tags.description }

    const content: form.ConceptInput = {
      name: nameJson,
      description: descriptionJson,
      kind: ConceptKind.TAG,
      originNamespace: 'https://cba.fro.at/wp-json/wp/v2/tags',
      summary: summaryJson,
    }
    const revisionId = this._revisionUri('tags', tags.id, new Date().getTime())
    const uri = this._uri('tags', tags.id)
    const headers = {
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }
    return [{ type: 'Concept', content, headers }]
  }

  private _mapStation(station: CbaStation): EntityForm[] {
    if (!station.title || !station.title.rendered) {
      throw new Error(
        `Missing or invalid title for station with ID ${station.id}`,
      )
    }

    var nameJson: { [k: string]: any } = {}
    nameJson[station.language_codes[0]] = { value: station.title.rendered }

    Object.entries(station.translations).forEach((entry) => {
      nameJson[entry[1]['language']] = { value: entry[1]['title'] }
    })

    const content: form.PublicationServiceInput = {
      medium: station.type || '',
      address: station.link || '',
      name: nameJson,
    }

    const revisionId = this._revisionUri(
      'station',
      station.id,
      parseAsUTC(station.modified).getTime(),
    )

    const uri = this._uri('station', station.id)

    const headers = {
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }

    return [{ type: 'PublicationService', content, headers }]
  }

  private _mapSeries(series: CbaSeries): EntityForm[] {
    if (!series.title || !series.title.rendered) {
      throw new Error('Series title is missing.')
    }

    var descriptionJson: { [k: string]: any } = {}
    descriptionJson[series.language_codes[0]] = {
      value: series.content.rendered,
    }
    var summaryJson: { [k: string]: any } = {}
    summaryJson[series.language_codes[0]] = { value: series.content.rendered }
    var titleJson: { [k: string]: any } = {}
    titleJson[series.language_codes[0]] = { value: series.title.rendered }

    Object.entries(series.translations).forEach((entry) => {
      titleJson[entry[1]['language']] = { value: entry[1]['title'] }
      summaryJson[entry[1]['language']] = { value: entry[1]['content'] }
      descriptionJson[entry[1]['language']] = {
        value: entry[1]['content'],
      }
    })

    const content: form.ContentGroupingInput = {
      title: titleJson,
      description: descriptionJson,
      groupingType: 'show',
      subtitle: null,
      summary: summaryJson,
      broadcastSchedule: null,
      startingDate: null,
      terminationDate: null,
      variant: ContentGroupingVariant.EPISODIC,
    }
    const revisionId = this._revisionUri(
      'series',
      series.id,
      parseAsUTC(series.modified).getTime(),
    )
    const uri = this._uri('series', series.id)
    const headers = {
      RevisionUris: [revisionId],
      EntityUris: [uri],
    }
    return [{ type: 'ContentGrouping', content, headers }]
  }

  private _mapPost(post: CbaPost): EntityForm[] {
    try {
      const mediaAssetLinks = []
      var licenseUri: string[] = []
      const entities: EntityForm[] = []

      if (post._fetchedAttachements?.length) {
        const mediaAssetsAndFiles = post._fetchedAttachements
          .map((attachement) => this._mapAudio(attachement))
          .flat()

        const mediaAssetUris = mediaAssetsAndFiles
          .filter((entity) => entity.type === 'MediaAsset')
          .map((x) => x.headers?.EntityUris || [])
          .flat()
          .map((uri) => ({ uri }))

        mediaAssetLinks.push(...mediaAssetUris)
        entities.push(...mediaAssetsAndFiles)
      }

      if (post.featured_image) {
        mediaAssetLinks.push({ uri: this._uri('image', post.featured_image) })
      }

      if (post.license && post.license.license && post.license.version) {
        const license = this._mapLicense(
          post.license.license + post.license.version,
        )

        licenseUri = license.headers?.EntityUris || []
        entities.push(license)
      }

      const categories =
        post.categories
          ?.map((cbaId) => this._uriLink('categories', cbaId))
          .filter(notEmpty) ?? []
      const tags =
        post.tags
          ?.map((cbaId) => this._uriLink('tags', cbaId))
          .filter(notEmpty) ?? []
      const conceptLinks = [...categories, ...tags]

      var title: { [k: string]: any } = {}
      title[post.language_codes[0]] = { value: post.title.rendered }

      var summary: { [k: string]: any } = {}
      summary[post.language_codes[0]] = { value: post.excerpt.rendered }

      var contentJson: { [k: string]: any } = {}
      contentJson[post.language_codes[0]] = { value: post.content.rendered }

      if (Array.isArray(post.translations)) {
        Object.entries(post.translations).forEach((entry) => {
          title[entry[1]['language']] = { value: entry[1]['post_title'] }
          summary[entry[1]['language']] = { value: entry[1]['post_excerpt'] }
          contentJson[entry[1]['language']] = {
            value: entry[1]['post_content'],
          }
        })
      } else {
        var temp = post.translations as any
        Object.keys(post.translations).forEach((code) => {
          title[code] = { value: temp[code]['title'] }
          summary[code] = { value: temp[code]['excerpt'] }
          contentJson[code] = { value: temp[code]['content'] }
        })
        //title[Object.keys(post.translations)[0]]
      }

      const content: form.ContentItemInput = {
        pubDate: new Date(post.date),
        content: contentJson,
        contentFormat: 'text/html',
        title: title,
        subtitle: 'missing',
        summary: summary,
        PublicationService: this._uriLink('station', post.meta.station_id),
        Concepts: conceptLinks,
        MediaAssets: mediaAssetLinks,
        PrimaryGrouping: this._uriLink('series', post.post_parent),
        contentUrl: post.link,
        originalLanguages: { language_codes: post.language_codes },
        License: licenseUri.length > 0 ? { uri: licenseUri[0] } : null,
        //licenseUid
        //primaryGroupingUid
        //contributor
        //AdditionalGroupings
        //License
        //BroadcastEvents
      }
      const revisionId = this._revisionUri(
        'post',
        post.id,
        parseAsUTC(post.modified).getTime(),
      )
      const entityUri = this._uri('post', post.id)

      const headers = {
        RevisionUris: [revisionId],
        EntityUris: [entityUri],
      }
      entities.push({
        type: 'ContentItem',
        content,
        headers,
      })
      return entities
    } catch (error) {
      console.error(`Error mapping post with ID ${post.id}:`, error)
      throw error
    }
  }

  private _mapTranscripts(
    media: any,
    transcripts: any[],
    mediaAssetLinks: any,
  ): EntityForm[] {
    const entities: EntityForm[] = []

    transcripts.forEach((transcript) => {
      const transcriptId = this._uri('transcript', transcript.id)
      const content: form.TranscriptInput = {
        language: transcript['language'],
        text: transcript['transcript'],
        engine: 'engine',
        MediaAsset: mediaAssetLinks,
        license: transcript['license'],
        subtitleUrl: transcript['subtitles'],
        author: transcript['author'],
      }
      entities.push({
        type: 'Transcript',
        content,
        headers: { EntityUris: [transcriptId] },
      })
    })

    return entities
  }

  private _mapLicense(name: string): EntityForm {
    const licenseId = this._uri('license', name)
    const license: form.LicenseInput = {
      name: name,
    }
    const entity: EntityForm = {
      type: 'License',
      content: license,
      headers: { EntityUris: [licenseId] },
    }
    return entity
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
    if (this.config.apiKey) {
      url.searchParams.set('api_key', this.config.apiKey)
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

/**
 * Parse a datetime string without timezone information as a UTC date
 *
 * @param dateString Datetime string in format 1998-10-17T00:00:00
 */
function parseAsUTC(dateString: string): Date {
  return new Date(dateString + '.000Z')
}
