import RssParser from 'rss-parser'
import zod from 'zod'
import {
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
} from '../datasource.js'
import { EntityBatch, EntityForm } from '../entity.js'
import { createHash, createJsonHash } from '../helpers/hash.js'

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
  newestDate?: Date
  latestKnownDate?: Date
  pageNumber?: number
  isFinished: boolean
}
type CursorOldest = {
  page: number
  done: boolean
}

type Cursor = {
  newest: CursorNewest
  oldest: CursorOldest
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

  async _crawlNewestUntil(
    cursor: CursorNewest,
  ): Promise<{ entities: EntityForm[]; cursor: CursorNewest }> {
    const url = new URL(this.endpoint)

    // TODO: Make configurable
    const pagination = {
      offsetParam: 'start',
      pageSizeParam: 'anzahl',
      pageSize: 20,
    }

    if (!cursor.newestDate) {
      const { feed, entities } = await this.fetchPage(url)
      if (!feed.items.length) return { entities: [], cursor }
      // TODO: Iterate and find latest.
      // TODO: What if date is not set
      const newestPubDate = new Date(feed.items[0].pubDate!)
      const nextCursor = {
        newestDate: newestPubDate,
        pageNumber: 0,
        isFinished: false,
      }
      return {
        entities,
        cursor: nextCursor,
      }
    } else {
      const page = cursor.pageNumber || 0
      url.searchParams.set(
        pagination.offsetParam,
        (page * pagination.pageSize).toString(),
      )
      url.searchParams.set(
        pagination.pageSizeParam,
        pagination.pageSize.toString(),
      )

      const { feed, entities } = await this.fetchPage(url)
      if (!feed.items.length) return { entities: [], cursor }
      // TODO: Iterate and find latest.
      // TODO: What if date is not set
      const oldestPubDate = new Date(feed.items[feed.items.length - 1].pubDate!)
      const newestPubDate = new Date(feed.items[0].pubDate!)
      let latestKnownDate = cursor.latestKnownDate
      if (!latestKnownDate || newestPubDate > new Date(latestKnownDate)) {
        latestKnownDate = newestPubDate
      }

      // console.log('oldestPubDate', new Date(oldestPubDate))
      // console.log('cursorDate', new Date(cursor.newestDate))
      if (oldestPubDate < new Date(cursor.newestDate)) {
        const nextCursor = {
          newestDate: latestKnownDate || newestPubDate,
          pageNumber: 0,
          latestKnownDate,
          isFinished: new Date(latestKnownDate) <= newestPubDate,
        }
        return {
          entities,
          cursor: nextCursor,
        }
      } else {
        const nextCursor = {
          newestDate: cursor.newestDate,
          pageNumber: page + 1,
          latestKnownDate,
          isFinished: false,
        }
        return {
          entities,
          cursor: nextCursor,
        }
      }
    }
  }

  // TODO: Implement
  async _crawlBackwardsFrom(offset: number) {}

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
    // if (cursor) cursor = JSON.parse(cursor)
    // else cursor =
    const cursor = (
      cursorInput
        ? JSON.parse(cursorInput)
        : {
            newest: {},
            oldest: {},
          }
    ) as Cursor
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
  ): Promise<{ mediaAssets: string[]; entities: EntityForm[] }> {
    const entities: EntityForm[] = []
    if (!item.enclosure) {
      return { mediaAssets: [], entities: [] }
    }
    const fileUid = this._urn('file', itemSlug)

    entities.push({
      type: 'File',
      content: {
        uid: fileUid,
        contentUrl: item.enclosure.url,
      },
      revision: {
        alternativeIds: [this._urn('rev', 'file', revisionSlug)],
      },
    })

    const mediaUid = this._urn('media', itemSlug)

    entities.push({
      type: 'MediaAsset',
      content: {
        uid: mediaUid,
        title: item.title || item.guid || 'missing',
        file: fileUid,
        duration: 0,
        mediaType: 'audio',
      },
      revision: {
        alternativeIds: [this._urn('rev', 'media', revisionSlug)],
      },
    })

    return { entities, mediaAssets: [mediaUid] }
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
      uid: this._urn('content', itemSlug),
      title: item.title || item.guid || 'missing',
      summary: item.contentSnippet,
      content: item.content || '',
      contentFormat: 'text/plain',
      pubDate: item.pubDate ? new Date(item.pubDate) : null,
      mediaAssets,
    }
    const revision = {
      alternativeIds: [this._urn('rev', 'content', revisionSlug)],
    }
    entities.push({ type: 'ContentItem', content, revision })
    return entities
  }
}
