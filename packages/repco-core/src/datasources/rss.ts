import RssParser from 'rss-parser'
import zod from 'zod'
import { log } from 'repco-common'
import { Link } from 'repco-common/zod'
import { form } from 'repco-prisma'
import { fetch } from 'undici'
import {
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
  FetchUpdatesResult,
  parseBodyCached,
  setParsedBody,
  SourceRecordForm,
} from '../datasource.js'
import { EntityForm } from '../entity.js'
import { createHash } from '../util/hash.js'
import { createRandomId } from '../util/id.js'

type ParsedFeed = RssParser.Output<any>

export class RssDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new RssDataSource(parsedConfig)
  }
  get definition() {
    return {
      uid: 'repco:datasource:rss',
      name: 'RSS',
    }
  }
}

const configSchema = zod.object({
  endpoint: zod.string().url(),
  repo: zod.string(),
  language: zod.string().or(zod.null()).optional(),
})
type ConfigSchema = zod.infer<typeof configSchema>

type CursorNewest = {
  lastCompletionDate?: Date
  mostRecentPubDate?: Date
  leastRecentPubDate?: Date
  pageNumber?: number
  isFinished: boolean
  maxPageNumber: number
}
type CursorOldest = {
  page: number
  done: boolean
}

type Cursor = {
  newest: CursorNewest
  oldest: CursorOldest
}

function parseCursor(input?: string | null): Cursor {
  const cursor = input
    ? JSON.parse(input)
    : {
        newest: {},
        oldest: {},
      }
  const dateFields = [
    'lastCompletionDate',
    'mostRecentPubDate',
    'leastRecentPubDate',
  ]
  for (const field of dateFields) {
    if (cursor.newest[field])
      cursor.newest[field] = new Date(cursor.newest[field])
  }
  return cursor as Cursor
}

function getDateRangeFromFeed(feed: RssParser.Output<any>): [Date, Date] {
  let newest = new Date()
  let oldest = new Date()
  if (feed.items[0] && feed.items[0].pubDate) {
    newest = new Date(feed.items[0].pubDate)
  }
  const last = feed.items[feed.items.length - 1]
  if (last && last.pubDate) {
    oldest = new Date(last.pubDate)
  }
  return [newest, oldest]
}

export class RssDataSource extends BaseDataSource implements DataSource {
  endpoint: URL
  baseUri: string
  parser: RssParser = new RssParser({
    customFields: {
      item: [
        'frn:language',
        'xml:lang',
        'frn:title',
        'frn:licence',
        'frn:radio',
        'image',
        'itunes:image',
        'image',
      ],
    },
  })
  uriPrefix: string
  repo: string
  language: string | null | undefined
  constructor(config: ConfigSchema) {
    super()
    const endpoint = new URL(config.endpoint)
    endpoint.hash = ''
    this.endpoint = endpoint
    this.baseUri = removeProtocol(this.endpoint)
    this.repo = config.repo
    this.uriPrefix = `repco:rss:${this.endpoint.host}`
    this.language = config.language
  }

  get config() {
    return { endpoint: this.endpoint.toString(), language: this.language }
  }

  get definition(): DataSourceDefinition {
    const uid = this.repo + ':' + this.baseUri
    return {
      name: 'RSS data source',
      uid,
      pluginUid: 'repco:datasource:rss',
    }
  }

  canFetchUri(uri: string): boolean {
    if (uri === this.endpoint.toString()) return true
    return false
  }

  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    if (uri === this.endpoint.toString()) {
      const body = await this.fetchPage(this.endpoint)
      return [
        {
          sourceType: 'primaryFeed',
          contentType: 'application/rss+xml',
          sourceUri: uri,
          body,
        },
      ]
    }
    return []
  }

  // The algorithm works as follows:
  // 1. Fetch most recent page
  private async _crawlNewestUntil(
    cursor: CursorNewest,
  ): Promise<{ url: URL; xml: string }> {
    const url = new URL(this.endpoint)

    // TODO: Make configurable
    var pagination = {
      offsetParam: 'offset',
      limitParam: 'limit',
      limit: 50,
    }
    if (url.href.indexOf('freie-radios') != -1) {
      pagination = {
        offsetParam: 'start',
        limitParam: 'anzahl',
        limit: 50,
      }
    }

    const page = cursor.pageNumber || 0
    url.searchParams.set('paged', page.toString())
    url.searchParams.set('sort', 'modifiedAt')
    url.searchParams.set(pagination.limitParam, pagination.limit.toString())
    if (page * pagination.limit > 0) {
      url.searchParams.set(
        pagination.offsetParam,
        (page * pagination.limit).toString(),
      )
    }

    const xml = await this.fetchPage(url)
    return { url, xml }
  }

  private extractNextCursor(cursor: CursorNewest, feed: ParsedFeed) {
    if (!feed.items.length) return cursor
    const page = cursor.pageNumber || 0

    const [newestPubDate, oldestPubDate] = getDateRangeFromFeed(feed)

    const previousMostRecentPubDate = cursor.mostRecentPubDate || new Date(0)
    const mostRecentPubDate =
      newestPubDate > previousMostRecentPubDate
        ? newestPubDate
        : previousMostRecentPubDate

    const lastLeastRecentPubDate = cursor.leastRecentPubDate || new Date(0)
    const leastRecentPubDate =
      lastLeastRecentPubDate < oldestPubDate
        ? lastLeastRecentPubDate
        : oldestPubDate

    const maxPageNumber = Math.max(page, cursor.pageNumber || 0)
    let nextCursor: CursorNewest
    // Case A: Oldest date from page is older than the most recent date of last fetch.
    // This means we caught up the new items.
    // We reset to page 0. We are finished if this fetch already was on page 0.
    if (
      cursor.lastCompletionDate &&
      oldestPubDate < cursor.lastCompletionDate
    ) {
      nextCursor = {
        lastCompletionDate: mostRecentPubDate,
        pageNumber: 0,
        mostRecentPubDate,
        leastRecentPubDate,
        isFinished: page === 0,
        maxPageNumber,
      }
      // Case B: Oldest date from this page is still newer than the most recent date from the last complete fetch.
      // This means: Increase page number to keep fetching untilwe reach the most recent pub date.
    } else {
      nextCursor = {
        lastCompletionDate: cursor.lastCompletionDate,
        pageNumber: page + 1,
        mostRecentPubDate,
        leastRecentPubDate,
        isFinished: false,
        maxPageNumber,
      }
    }

    return nextCursor
  }

  // TODO: Implement
  // async _crawlBackwardsFrom(cursor: Cursor) {
  // const lastLeastRecentPubDate = cursor.newest.leastRecentPubDate || new Date()
  // const maxPageNumber = cursor.newest.maxPageNumber || 0
  // // TODO: Make configurable
  // const pagination = {
  //   offsetParam: 'start',
  //   limitParam: 'anzahl',
  //   limit: 5,
  // }
  // const url = new URL(this.endpoint)
  // const page = maxPageNumber + 1
  // url.searchParams.set(pagination.limitParam, pagination.limit.toString())
  // url.searchParams.set(
  //   pagination.offsetParam,
  //   (page * pagination.limit).toString(),
  // )
  // const { feed, entities } = await this.fetchPage(url)
  // const [newestPubDate, oldestPubDate] = getDateRangeFromFeed(feed)
  // const nextCursor = { ...cursor }
  // }

  async fetchPage(url: URL): Promise<string> {
    // console.log('FETCH', url.toString())
    const maxRetries = 50
    let timeout = 1
    let retries = 0
    while (true) {
      try {
        const res = await fetch(url)
        log.debug(
          `fetch ${url.toString()}: ${res.ok ? 'OK' : 'FAIL'} ${res.status}`,
        )
        if (res.ok) {
          const text = await res.text()
          return text
        }
        throw new Error(`Got status ${res.status} for ${url.toString()}`)
      } catch (err) {
        retries += 1
        if (retries >= maxRetries) {
          throw err
        }

        // retry
        const wait = timeout * 1000
        timeout = timeout * 2
        await new Promise((resolve) => setTimeout(resolve, wait))
      }
    }
  }

  async mapPage(feed: any) {
    const entities = []
    for (const item of feed.items) {
      entities.push(...(await this._mapItem(item, feed.language)))
    }
    return entities
  }

  async fetchUpdates(cursorInput: string | null): Promise<FetchUpdatesResult> {
    const cursor = parseCursor(cursorInput)
    const nextCursor = cursor
    const date = new Date()
    const { url, xml } = await this._crawlNewestUntil(cursor.newest)

    try {
      const feed = await this.parser.parseString(xml)
      cursor.newest = this.extractNextCursor(cursor.newest, feed)

      const sourceUri = new URL(this.endpoint)
      sourceUri.hash = date.toISOString()
      const record = {
        contentType: 'application/rss+xml',
        sourceUri: sourceUri.toString(),
        sourceType: 'feedPage',
        body: xml,
      }
      setParsedBody(record, feed)
      return {
        cursor: JSON.stringify(nextCursor),
        records: [record],
      }
    } catch (err) {
      log.error(`Failed to parse feed from ${url.toString()}: ${err}`)
      if (nextCursor.newest.pageNumber) nextCursor.newest.pageNumber += 1
      return {
        cursor: JSON.stringify(nextCursor),
        records: [],
      }
    }
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    if (record.sourceType === 'feedPage') {
      const feed = await parseBodyCached(record, async (record) =>
        this.parser.parseString(record.body),
      )
      const entities = await this.mapPage(feed)
      return entities
    }
    if (record.sourceType === 'primaryFeed') {
      const feed = await parseBodyCached(record, async (record) =>
        this.parser.parseString(record.body),
      )
      var lang = feed['frn:language'] || feed['xml:lang'] || feed.language
      if (lang.length > 2) {
        lang = lang.slice(0, 2)
      }

      var titleJson: { [k: string]: any } = {}
      titleJson[lang] = {
        value: feed.title || feed.feedUrl || 'unknown',
      }
      var summaryJson: { [k: string]: any } = {}
      summaryJson[lang] = {
        value: '',
      }
      var descriptionJson: { [k: string]: any } = {}
      descriptionJson[lang] = {
        value: feed.description || '',
      }
      const pubService: form.PublicationServiceInput = {
        name: titleJson,
        medium: '',
        address: feed.feedUrl || '',
      }
      return [
        {
          type: 'PublicationService',
          content: pubService,
          headers: {
            EntityUris: [
              this._uri(
                'publicationservice',
                feed.title || feed.feedUrl || 'unknown',
              ),
            ],
          },
        },
      ]
    }
    throw new Error('Invalid source type: ' + record.sourceType)
  }

  async _extractMediaAssets(
    itemUri: string,
    item: RssParser.Item,
    language: string,
  ): Promise<{ mediaAssets: Link[]; entities: EntityForm[] }> {
    const entities: EntityForm[] = []
    if (!item.enclosure) {
      return { mediaAssets: [], entities: [] }
    }
    const fileUri = itemUri + '#file'

    entities.push({
      type: 'File',
      content: {
        contentUrl: item.enclosure.url,
      },
      headers: { EntityUris: [fileUri, item.enclosure.url] },
    })

    const mediaUri = itemUri + '#media'

    var titleJson: { [k: string]: any } = {}
    titleJson[language] = {
      value: item.title || item.guid || 'missing',
    }
    var descriptionJson: { [k: string]: any } = {}
    descriptionJson[language] = {
      value: '{}',
    }

    entities.push({
      type: 'MediaAsset',
      content: {
        title: titleJson,
        duration: 0,
        mediaType: item.enclosure.type || 'audio',
        Files: [{ uri: fileUri }],
        description: descriptionJson,
      },
      headers: { EntityUris: [mediaUri] },
    })

    return { entities, mediaAssets: [{ uri: mediaUri }] }
  }

  async _deriveItemUri(item: RssParser.Item): Promise<string> {
    if (item.guid) return 'rss:guid:' + removeProtocol(item.guid)
    if (item.enclosure?.url)
      return 'rss:hurl:' + (await createHash(item.enclosure.url))
    return 'rss:uuid:' + createRandomId()
  }

  async _mapItem(item: any, language: string): Promise<EntityForm[]> {
    const itemUri = await this._deriveItemUri(item)
    var licenseUri: string[] = []
    var publicationServiceUri: string[] = []
    var lang =
      item['frn:language'] || item['xml:lang'] || this.language || language
    if (lang.length > 2) {
      lang = lang.slice(0, 2)
    }
    const { entities, mediaAssets } = await this._extractMediaAssets(
      itemUri,
      item,
      lang,
    )

    if (item['frn:radio'] != null) {
      const pubService = this._mapPublicationService(item['frn:radio'], lang)
      publicationServiceUri = pubService.headers?.EntityUris || []
      entities.push(pubService)
    }

    if (item['frn:licence'] != null) {
      const license = this._mapLicense(item['frn:licence'])

      licenseUri = license.headers?.EntityUris || []
      entities.push(license)
    }

    var titleJson: { [k: string]: any } = {}
    titleJson[lang] = {
      value: item['frn:title'] || item.title || item.guid || 'missing',
    }
    var summaryJson: { [k: string]: any } = {}
    summaryJson[lang] = {
      value: item.contentSnippet || '{}',
    }
    var contentJson: { [k: string]: any } = {}
    contentJson[lang] = {
      value: item.content || '',
    }
    var contentUrlJson: { [k: string]: any } = {}
    contentUrlJson[lang] = {
      value: item.link || '',
    }

    const content: form.ContentItemInput = {
      title: titleJson,
      summary: summaryJson,
      content: contentJson,
      subtitle: {},
      contentFormat: 'text/plain',
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
      PrimaryGrouping: { uri: this.endpoint.toString() },
      MediaAssets: mediaAssets,
      contentUrl: contentUrlJson,
      originalLanguages: { language_codes: [lang] },
      PublicationService:
        publicationServiceUri.length > 0
          ? { uri: publicationServiceUri[0] }
          : null,
      License: licenseUri.length > 0 ? { uri: licenseUri[0] } : null,
      removed: false,
    }
    const headers = {
      EntityUris: [itemUri],
    }
    entities.push({ type: 'ContentItem', content, headers })
    return entities
  }

  private _mapPublicationService(name: string, lang: string): EntityForm {
    const publicationServiceId = this._uri('radio', name)

    var nameJson: { [k: string]: any } = {}
    nameJson[lang] = { value: name }

    const content: form.PublicationServiceInput = {
      name: nameJson,
      address: '',
    }
    const entity: EntityForm = {
      type: 'PublicationService',
      content,
      headers: { EntityUris: [publicationServiceId] },
    }
    return entity
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

  private _uri(type: string, id: string | number): string {
    return `${this.uriPrefix}:e:${type}:${id}`
  }
}

function removeProtocol(inputUrl: string | URL) {
  try {
    const url = new URL(inputUrl)
    return url.toString().replace(url.protocol + '//', '')
  } catch (err) {
    return inputUrl.toString()
  }
}
