import RssParser from 'rss-parser'
import zod from 'zod'
import { Link } from 'repco-common/zod'
import { fetch } from 'undici'
import {
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

export class RssDataSource implements DataSource {
  endpoint: URL
  baseUri: string
  parser: RssParser = new RssParser()
  constructor(config: ConfigSchema) {
    const endpoint = new URL(config.endpoint)
    endpoint.hash = ''
    this.endpoint = endpoint
    this.baseUri = removeProtocol(this.endpoint)
  }

  get config() {
    return { endpoint: this.endpoint.toString() }
  }

  get definition(): DataSourceDefinition {
    const uid = this.baseUri
    return {
      name: 'RSS data source',
      uid,
      pluginUid: 'repco:datasource:rss',
    }
  }

  canFetchUri(_uid: string): boolean {
    return false
  }

  async fetchByUri(_uid: string): Promise<SourceRecordForm[]> {
    return []
  }

  // The algorithm works as follows:
  // 1. Fetch most recent page
  private async _crawlNewestUntil(cursor: CursorNewest): Promise<string> {
    const url = new URL(this.endpoint)

    // TODO: Make configurable
    const pagination = {
      offsetParam: 'start',
      limitParam: 'anzahl',
      limit: 5,
    }

    const page = cursor.pageNumber || 0
    url.searchParams.set(pagination.limitParam, pagination.limit.toString())
    url.searchParams.set(
      pagination.offsetParam,
      (page * pagination.limit).toString(),
    )

    const xml = await this.fetchPage(url)
    return xml
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
  async _crawlBackwardsFrom(cursor: Cursor) {
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
  }

  async fetchPage(url: URL): Promise<string> {
    const res = await fetch(url)
    const text = await res.text()
    return text
  }

  async mapPage(feed: ParsedFeed) {
    const entities = []
    for (const item of feed.items) {
      entities.push(...(await this._mapItem(item)))
    }
    return entities
  }

  async fetchUpdates(cursorInput: string | null): Promise<FetchUpdatesResult> {
    const cursor = parseCursor(cursorInput)
    const nextCursor = cursor
    const date = new Date()
    const xml = await this._crawlNewestUntil(cursor.newest)

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
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    if (record.sourceType !== 'feedPage')
      throw new Error('Invalid source type: ' + record.sourceType)
    const feed = await parseBodyCached(record, async (record) =>
      this.parser.parseString(record.body),
    )
    const entities = await this.mapPage(feed)
    return entities
  }

  async _extractMediaAssets(
    itemUri: string,
    item: RssParser.Item,
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
      entityUris: [fileUri, item.enclosure.url],
    })

    const mediaUri = itemUri + '#media'

    entities.push({
      type: 'MediaAsset',
      content: {
        title: item.title || item.guid || 'missing',
        duration: 0,
        mediaType: 'audio',
        File: { uri: fileUri },
      },
      entityUris: [mediaUri],
    })

    return { entities, mediaAssets: [{ uri: mediaUri }] }
  }

  async _deriveItemUri(item: RssParser.Item): Promise<string> {
    if (item.guid) return 'rss:guid:' + removeProtocol(item.guid)
    if (item.enclosure?.url)
      return 'rss:hurl:' + (await createHash(item.enclosure.url))
    return 'rss:uuid:' + createRandomId()
  }

  async _mapItem(item: RssParser.Item): Promise<EntityForm[]> {
    const itemUri = await this._deriveItemUri(item)
    const { entities, mediaAssets } = await this._extractMediaAssets(
      itemUri,
      item,
    )
    const content = {
      title: item.title || item.guid || 'missing',
      summary: item.contentSnippet,
      content: item.content || '',
      contentFormat: 'text/plain',
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
      MediaAssets: mediaAssets
    }
    const headers = {
      entityUris: [itemUri],
    }
    entities.push({ type: 'ContentItem', content, ...headers })
    return entities
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
