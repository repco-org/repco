import { Link } from 'repco-common/zod'
import RssParser from 'rss-parser'
import zod from 'zod'
import {
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
} from '../datasource.js'
import { EntityBatch, EntityForm } from '../entity.js'
import { createHash, createJsonHash } from '../util/hash.js'

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
  baseUid: string
  parser: RssParser = new RssParser()
  constructor(config: ConfigSchema) {
    this.endpoint = new URL(config.endpoint)
    this.baseUid = 'urn:repco:rss:' + this.endpoint.hostname
  }

  get definition(): DataSourceDefinition {
    const uid = this.baseUid
    return {
      name: 'RSS data source',
      uid,
      pluginUid: 'repco:datasource:rss',
    }
  }

  canFetchUID(uid: string): boolean {
    return false
  }

  async fetchByUID(uid: string): Promise<EntityForm[]> {
    return []
  }

  // The algorithm works as follows:
  // 1. Fetch most recent page
  async _crawlNewestUntil(
    cursor: CursorNewest,
  ): Promise<{ entities: EntityForm[]; cursor: CursorNewest }> {
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

    const { feed, entities } = await this.fetchPage(url)
    if (!feed.items.length) return { entities: [], cursor }

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

    return {
      entities,
      cursor: nextCursor,
    }
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

  async fetchPage(
    url: URL,
  ): Promise<{ feed: RssParser.Output<any>; entities: EntityForm[] }> {
    const feed = await this.parser.parseURL(url.toString())
    const entities = []
    for (const item of feed.items) {
      entities.push(...(await this._mapItem(item)))
    }
    return { entities, feed }
  }

  async fetchUpdates(cursorInput: string | null): Promise<EntityBatch> {
    const cursor = parseCursor(cursorInput)
    const entities = []
    const nextCursor = cursor
    const res = await this._crawlNewestUntil(cursor.newest)
    entities.push(...res.entities)
    nextCursor.newest = res.cursor
    const batch = {
      cursor: JSON.stringify(nextCursor),
      entities,
    }
    return batch
  }

  _urn(...parts: string[]): string {
    return [this.baseUid, ...parts].join(':')
  }

  async _extractMediaAssets(
    itemSlug: string,
    revisionSlug: string,
    item: RssParser.Item,
  ): Promise<{ mediaAssets: Link[]; entities: EntityForm[] }> {
    const entities: EntityForm[] = []
    if (!item.enclosure) {
      return { mediaAssets: [], entities: [] }
    }
    const fileUid = this._urn('file', itemSlug)

    entities.push({
      type: 'File',
      content: {
        contentUrl: item.enclosure.url,
      },
      entityUris: [fileUid],
      revisionUris: [this._urn('rev', 'file', revisionSlug)],
    })

    const mediaUri = this._urn('media', itemSlug)

    entities.push({
      type: 'MediaAsset',
      content: {
        title: item.title || item.guid || 'missing',
        duration: 0,
        mediaType: 'audio',
        File: { uri: fileUid },
      },
      entityUris: [mediaUri],
      revisionUris: [this._urn('rev', 'media', revisionSlug)],
    })

    return { entities, mediaAssets: [{ uri: mediaUri }] }
  }

  async _deriveSlugs(
    item: RssParser.Item,
  ): Promise<{ revisionSlug: string; itemSlug: string }> {
    const revisionSlug = await createJsonHash(item)
    const itemSlug = await createHash(item.guid || JSON.stringify(item))
    return { revisionSlug, itemSlug }
  }

  async _mapItem(item: RssParser.Item): Promise<EntityForm[]> {
    const { revisionSlug, itemSlug } = await this._deriveSlugs(item)
    const { entities, mediaAssets } = await this._extractMediaAssets(
      itemSlug,
      revisionSlug,
      item,
    )
    const content = {
      title: item.title || item.guid || 'missing',
      summary: item.contentSnippet,
      content: item.content || '',
      contentFormat: 'text/plain',
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
      mediaAssets,
    }
    const headers = {
      revisionUris: [this._urn('rev', 'content', revisionSlug)],
      entityUris: [this._urn('content', itemSlug)],
    }
    entities.push({ type: 'ContentItem', content, ...headers })
    return entities
  }
}
