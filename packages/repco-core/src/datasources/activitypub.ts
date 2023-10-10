import zod from 'zod'
import { parse, toSeconds } from 'iso8601-duration'
import { log } from 'repco-common'
import { ConceptKind, ContentGroupingVariant, form } from 'repco-prisma'
import { ConceptInput } from 'repco-prisma/generated/repco/zod.js'
import { fetch } from 'undici'
import {
  ActivityHashTagObject,
  ActivityIconObject,
  ActivityIdentifierObject,
  ActivityVideoUrlObject,
  OutBox,
  Page,
  VideoObject,
} from './activitypub/types.js'
import {
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
  FetchUpdatesResult,
  SourceRecordForm,
} from '../datasource.js'
import { EntityForm } from '../entity.js'
import { HttpError } from '../util/error.js'
import { notEmpty } from '../util/misc.js'

const configSchema = zod.object({
  user: zod.string(),
  domain: zod.string(),
})
type ConfigSchema = zod.infer<typeof configSchema>

const hostLink = zod.object({
  rel: zod.string(),
  href: zod.string().optional(),
})
type HostLink = zod.infer<typeof hostLink>

const hostInfo = zod.object({
  subject: zod.string().optional(),
  alisases: zod.string().array().optional(),
  links: hostLink.array(),
})
type HostInfo = zod.infer<typeof hostInfo>

type ChannelInfo = {
  account: string
}

type Cursor = {
  lastPublishedDate: Date
}

function parseCursor(input?: string | null): Cursor {
  const cursor = input ? JSON.parse(input) : {}
  const dateFields = ['lastPublishedDate']
  for (const field of dateFields) {
    if (cursor[field]) cursor[field] = new Date(cursor[field])
  }
  return cursor as Cursor
}

export class ActivityPubDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new ActivityPubDataSource(parsedConfig)
  }
  get definition() {
    return {
      uid: 'urn:repco:datasource:activitypub',
      name: 'ActivityPub',
    }
  }
}

// function getDateRangeFromPage(feed: any): [Date, Date] {
//   let newest = new Date()
//   let oldest = new Date()
//   if (page.orderedItems[0] && page.orderedItems[0].pubDate) {
//     newest = new Date(page.orderedItems[0].pubDate)
//   }
//   const last = feed.items[feed.items.length - 1]
//   if (last && last.pubDate) {
//     oldest = new Date(last.pubDate)
//   }
//   return [newest, oldest]
// }

export class ActivityPubDataSource
  extends BaseDataSource
  implements DataSource
{
  user: string
  domain: string
  account: string
  host: string
  uriPrefix: string
  constructor(config: ConfigSchema) {
    super()
    this.user = config.user
    this.domain = config.domain
    this.account = config.user + '@' + config.domain
    this.host = 'https://' + config.domain
    this.uriPrefix = `repco:activityPub`
  }

  get config() {
    return {
      user: this.user,
      domain: this.domain,
      host: this.host,
    }
  }

  get definition(): DataSourceDefinition {
    return {
      name: 'ActivityPub data source',
      uid: 'urn:datasource:activitypub:' + this.account,
      pluginUid: 'urn:repco:datasource:activitypub',
    }
  }
  private async _fetchAs<T>(url: string): Promise<T> {
    try {
      const res = await fetch(url, {
        headers: {
          accept: 'application/activity+json',
        },
      })
      log.debug(`fetch (${res.status}, url: ${url})`)
      if (!res.ok) {
        throw await HttpError.fromResponseJson(res, url)
      }
      const json = await res.json()
      return json as T
    } catch (err) {
      log.debug(`Fetch failed: (url: ${url}, error: ${err})`)
      throw err
    }
  }

  async fetchWebfinger<Type>(): Promise<Type> {
    return this._fetchAs(
      `${this.host}/.well-known/webfinger?resource=acct:${this.account}`,
    )
  }

  canFetchUri(uri: string): boolean {
    const parsed = this.parseUri(uri)
    return !!(
      parsed &&
      parsed.kind === 'entity' &&
      ['videoFile', 'imageFile', 'videoMedia', 'videoContent'].includes(
        parsed.type,
      )
    )
  }

  // At the moment fetches only entities with type file (videoUrls, teaserImageUrls),
  // video (Video MediaAssets) and videoContent (Video ContentItems)
  // category and tags cannot be fetched by uri as they don't have urls
  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    const parsed = this.parseUri(uri)
    if (!parsed) {
      throw new Error('Invalid URI')
    }
    const { id, type } = parsed

    const [body] = await Promise.all([this._fetchAs(id)])
    return [
      {
        body: JSON.stringify(body),
        contentType: 'application/json',
        sourceType: type,
        sourceUri: uri,
      },
    ]
  }

  private _getLastPageNumber(numItems: number): number {
    const lastPageNumber: number = Math.floor(numItems / 10) + 1
    return lastPageNumber
  }

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    try {
      let channelSourceRecord
      // First ingest: save channel as ContentGrouping
      if (cursorString === null) {
        const channelInfo: ChannelInfo = { account: this.account }
        channelSourceRecord = {
          body: JSON.stringify(channelInfo),
          contentType: 'application/json',
          sourceType: 'activityPubChannel',
          sourceUri: this._uri('account', this.account),
        }
      }
      const cursor = parseCursor(cursorString)
      const info = await this.fetchWebfinger<HostInfo>()
      const profile = info.links.find((link) => link.rel === 'self')?.href
      const outbox =
        profile && (await this._fetchAs<OutBox>(`${profile}/outbox`))
      const firstPageUrl = outbox && outbox.first
      if (!firstPageUrl) {
        throw new Error(`Could not find first page of outbox ${profile}/outbox`)
      }
      // collect new video entities
      const newVideoObjects: VideoObject[] = []
      // start with last page
      let pageNumber = outbox && this._getLastPageNumber(outbox.totalItems)
      if (!pageNumber) {
        throw new Error(
          `Could not get number of last page of outbox ${profile}/outbox`,
        )
      }
      pageNumber++
      // loop backwards over pages
      while (pageNumber >= 2) {
        pageNumber--
        let currentPageUrl =
          firstPageUrl && firstPageUrl.replace('page=1', `page=${pageNumber}`)
        const currentPage =
          currentPageUrl && (await this._fetchAs<Page>(currentPageUrl))
        // if no items are on the page
        if (currentPage && currentPage.orderedItems.length === 0) {
          continue
        }
        const items =
          currentPage &&
          (await Promise.all(
            currentPage.orderedItems.map((item) => {
              if (item.type === 'Announce' && typeof item.object === 'string') {
                return this._fetchAs<VideoObject>(item.object)
              } else if (item.type === 'Create' && item.object !== undefined) {
                return this._fetchAs<VideoObject>(
                  (item.object as VideoObject).id,
                )
              }
            }),
          ))
        if (items === undefined || items === '') {
          throw new Error(`Could not catch items under url ${currentPageUrl}.`)
        }
        // iterate over items on page backwards to find items that are newer than the cursor
        for (var i = items.length - 1; i >= 0; i--) {
          if (items[i] === undefined) {
            continue
          }
          if (new Date(items[i]!.published) <= cursor.lastPublishedDate) {
            continue
          }
          newVideoObjects.push(items[i]!)
          cursor.lastPublishedDate = new Date(items[i]!.published)
        }
      }
      const records = [
        {
          body: JSON.stringify(newVideoObjects),
          contentType: 'application/json',
          sourceType: 'videoObjects',
          sourceUri: firstPageUrl, // TODO @Frando: This url always stays the same, independent of the amount of videos pushed
        },
      ]
      if (channelSourceRecord !== undefined) {
        records.push(channelSourceRecord as SourceRecordForm)
      }
      return {
        cursor: JSON.stringify(cursor),
        records,
      }
    } catch (error) {
      console.error(`Error fetching updates: ${error}`)
      throw error
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
    } else if (parts[0] === 'r') {
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

  private _revisionUri(
    type: string,
    id: string | number,
    revisionId: string | number,
  ): string {
    return `${this.uriPrefix}:r:${type}:${id}:${revisionId}`
  }

  private _uri(type: string, id: string | number): string {
    return `${this.uriPrefix}:e:${type}:${id}`
  }

  private _uriLink(type: string, id: string | number): { uri: string } | null {
    if (id === undefined || id === null) return null
    return { uri: this._uri(type, id) }
  }

  private _mapVideoToFileEntity(videoUrl: ActivityVideoUrlObject): EntityForm {
    const fileId = this._uri('videoFile', videoUrl.href)
    const videoFile: form.FileInput = {
      contentUrl: videoUrl.href,
      mimeType: videoUrl.mediaType,
      resolution: videoUrl.height.toString(), // width is missing, but probably not important. add 'p'?
      contentSize: videoUrl.size < 2147483647 ? videoUrl.size : 2147483646, // TODO: implement correct size
    }
    const fileEntity: EntityForm = {
      type: 'File',
      content: videoFile,
      headers: { EntityUris: [fileId] },
    }
    return fileEntity
  }

  private _findLargestTeaserImage(
    icons: ActivityIconObject[],
  ): ActivityIconObject {
    if (icons.length === 1) {
      return icons[0]
    }
    return icons.reduce((prev, current) => {
      return prev.height && current.height && prev.height > current.height
        ? prev
        : current
    })
  }

  private _mapImagesToFileEntity(teaserImage: ActivityIconObject): EntityForm {
    const resolution =
      teaserImage.width && teaserImage.height
        ? teaserImage.height.toString() + 'x' + teaserImage.width.toString()
        : null
    const fileId = this._uri('imageFile', teaserImage.url)
    const imageFile: form.FileInput = {
      contentUrl: teaserImage.url,
      mimeType: teaserImage.mediaType,
      resolution: resolution,
    }
    const fileEntity: EntityForm = {
      type: 'File',
      content: imageFile,
      headers: { EntityUris: [fileId] },
    }
    return fileEntity
  }

  private _mapTagToConceptEntity(tag: ActivityHashTagObject): EntityForm {
    const concept: ConceptInput = {
      kind: ConceptKind.TAG,
      name: tag.name,
    }
    const uri = this._uri('tags', tag.name)
    const ConceptEntity: EntityForm = {
      type: 'Concept',
      content: concept,
      headers: { EntityUris: [uri] },
    }
    return ConceptEntity
  }

  private _mapCategoryToConceptEntity(
    category: ActivityIdentifierObject,
  ): EntityForm[] {
    const concept: form.ConceptInput = {
      kind: ConceptKind.CATEGORY,
      name: category.name,
      // TODO: find originNamespace of AP categories
    }
    const uri = this._uri('category', 'peertube:' + category.name)
    const headers = {
      EntityUris: [uri],
    }
    return [{ type: 'Concept', content: concept, headers }]
  }

  private _mapVideoObjectToMediaAsset(video: VideoObject): EntityForm[] {
    const mediaAssetUri = this._uri('videoMedia', video.id)
    let files = []
    let entities = []

    // create Files for videos in "url"
    const videoUrls = video.url.filter(
      (url) => url.mediaType && url.mediaType.startsWith('video'),
    ) as ActivityVideoUrlObject[]
    const videoFileEntities =
      videoUrls && videoUrls.map((url) => this._mapVideoToFileEntity(url))
    entities.push(...videoFileEntities)
    const fileUris = videoUrls.map((url) => ({
      uri: this._uri('videoFile', url.href),
    }))
    if (fileUris !== undefined && fileUris !== null) {
      files.push(...fileUris)
    }
    // create File for Images in "icon"
    let teaserImageUri = undefined
    if (
      video.hasOwnProperty('icon') &&
      video.icon !== undefined &&
      video.icon.length >= 1
    ) {
      const teaserImage = this._findLargestTeaserImage(video.icon)
      const imageFileEntity = this._mapImagesToFileEntity(teaserImage)
      entities.push(imageFileEntity)
      teaserImageUri = this._uri('imageFile', teaserImage.url)
      teaserImageUri && files.push({ uri: teaserImageUri })
    }

    // transform video.category and video.tags into Concepts
    let conceptUris = []
    if (video.hasOwnProperty('category') && video.category !== undefined) {
      const categoryConcept = this._mapCategoryToConceptEntity(video.category)
      entities.push(...categoryConcept)
      const categoryUri = this._uri('category', video.category.identifier)
      conceptUris.push({ uri: categoryUri })
    }
    if (video.hasOwnProperty('tag') && video.tag !== undefined) {
      const tagConcepts = video.tag.map((tag) =>
        this._mapTagToConceptEntity(tag),
      )
      entities.push(...tagConcepts)
      const tagUris = video.tag.map((tag) => ({
        uri: this._uri('tags', tag.href ? tag.href : tag.name),
      }))
      conceptUris.push(...tagUris)
    }

    // format duration from iso8601 to seconds
    const duration = toSeconds(parse(video.duration))

    const asset: form.MediaAssetInput = {
      title: video.name,
      description: video.content,
      duration,
      mediaType: video.type, //"Video"
      Files: files,
      ContentItems: [],
      //License: video.licence, // TODO: transform (https://framacolibri.org/t/problems-with-the-current-license-system/5695)
      // Contributions: null,
      TeaserImage: { uri: teaserImageUri },
      Concepts: conceptUris.length > 0 ? conceptUris : undefined,
    }

    const mediaEntity: EntityForm = {
      type: 'MediaAsset',
      content: asset,
      headers: { EntityUris: [mediaAssetUri] },
    }

    return [mediaEntity, ...entities]
  }

  private _mapVideoObjectToContentItem(video: VideoObject): EntityForm[] {
    try {
      const contentItemEntityUri = this._uri('videoContent', video.id)
      const entities: EntityForm[] = []

      // create File- and mediaAsset entities for all videos and images of the videObject
      const mediaAssetsAndFiles = this._mapVideoObjectToMediaAsset(video)
      entities.push(...mediaAssetsAndFiles)
      const mediaAssetUris = mediaAssetsAndFiles
        .filter((entity) => entity.type === 'MediaAsset')
        .map((x) => x.headers?.EntityUris || [])
        .flat()
        .map((uri) => ({ uri }))

      // get the uris of Concept entities created in _mapVideoObjectToMediaAsset
      const conceptLinks = []
      const category =
        video.category &&
        video.category !== undefined &&
        this._uriLink('category', video.category.identifier)
      category && conceptLinks.push(category)

      const tags =
        video.tag
          ?.map((tag) => this._uriLink('tags', tag.href ? tag.href : tag.name))
          .filter(notEmpty) ?? []
      conceptLinks.push(...tags)

      const content: form.ContentItemInput = {
        title: video.name,
        subtitle: 'missing',
        pubDate: new Date(video.published),
        content: video.content || '',
        contentFormat: video.mediaType, // "text/markdown"
        // licenseUid TODO: plan to abolish License table and add license as string plus license_details
        Concepts: conceptLinks,
        //Contributions
        //License
        MediaAssets: mediaAssetUris,
        PrimaryGrouping: this._uriLink('account', this.account),
      }
      const revisionUri = this._revisionUri(
        'videoContent',
        video.id,
        new Date().getTime(), // TODO: change when we have the date of the activity
      )

      const headers = {
        RevisionUris: [revisionUri],
        EntityUris: [contentItemEntityUri],
      }

      entities.push({
        type: 'ContentItem',
        content,
        headers,
      })

      return entities
    } catch (error) {
      console.error(`Error mapping VideoObject with ID ${video.id}:`, error)
      throw error
    }
  }

  private _mapChannelInfoToContentGrouping(
    channelInfo: ChannelInfo,
  ): EntityForm[] {
    try {
      const contentGrouping: form.ContentGroupingInput = {
        title: channelInfo.account,
        variant: ContentGroupingVariant.EPISODIC, // @Frando is this used as intended?
        groupingType: 'activityPubChannel',
      }
      const contentGroupingUri = this._uri('account', channelInfo.account)
      const headers = {
        EntityUris: [contentGroupingUri],
      }

      return [
        {
          type: 'ContentGrouping',
          content: contentGrouping,
          headers,
        },
      ]
    } catch (error) {
      console.error(
        `Error mapping ChannelInfo for account ${channelInfo.account}:`,
        error,
      )
      throw error
    }
  }

  async mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]> {
    try {
      const body = JSON.parse(record.body)
      if (record.sourceType === 'videoObjects') {
        return (body as VideoObject[])
          .map((video) => this._mapVideoObjectToContentItem(video))
          .flat()
      }
      if (record.sourceType === 'activityPubChannel') {
        return this._mapChannelInfoToContentGrouping(body as ChannelInfo)
      }
      throw new Error(`Mapping source type ${record.sourceType} not possible.`)
    } catch (error) {
      throw new Error(`Error body undefined: ${error}`)
    }
  }
}
