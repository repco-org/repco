import zod from 'zod'
import { parse, toSeconds } from 'iso8601-duration'
import { getGlobalApInstance } from 'repco-activitypub'
import { log } from 'repco-common'
import { ContentGroupingVariant, form } from 'repco-prisma'
import { ConceptInput } from 'repco-prisma/generated/repco/zod.js'
import { fetch } from 'undici'
import {
  ActivityHashTagObject,
  ActivityHlsPlaylistUrlObject,
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
  repo: zod.string(),
})
type ConfigSchema = zod.infer<typeof configSchema>

type ChannelInfo = {
  account: string
}

type Cursor = {
  lastIngest: Date
  direction: 'front' | 'back'
  pageNumber: number
}

function parseCursor(input: string, defaults: any): Cursor {
  const cursor = JSON.parse(input)
  const dateFields = ['lastIngest']
  for (const field of dateFields) {
    if (cursor[field]) cursor[field] = new Date(cursor[field])
  }
  return { ...defaults, ...cursor } as Cursor
}

export class ActivityPubDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new ActivityPubDataSource(parsedConfig)
  }
  get definition() {
    return {
      uid: 'repco:datasource:activitypub',
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
  repo: string
  constructor(config: ConfigSchema) {
    super()
    this.user = config.user
    this.domain = config.domain
    let domain
    if (
      config.domain.startsWith('http://') ||
      config.domain.startsWith('https://')
    ) {
      this.host = config.domain
      domain = config.domain.replace(/^http(s?):\/\//, '')
    } else {
      this.host = 'https://' + config.domain
      domain = config.domain
    }
    this.account = config.user + '@' + domain
    this.uriPrefix = `repco:activityPub`
    this.repo = config.repo
  }

  get config() {
    return {
      user: this.user,
      domain: this.domain,
      repo: this.repo,
    }
  }

  get definition(): DataSourceDefinition {
    return {
      name: `ActivityPub ${this.account}`,
      uid: `repco:${this.repo}:datasource:activitypub:` + this.account,
      pluginUid: 'repco:datasource:activitypub',
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

  async getAndInitAp() {
    try {
      const remoteActorId = `@${this.config.user}@${this.config.domain}`
      const localName = this.repo
      const ap = getGlobalApInstance()
      if (!ap) throw new Error('activitypub is not initialized')
      // ensure actor and follow
      const localActor = await ap.getOrCreateActor(localName)
      const remoteId = await ap.followRemoteActor(
        localActor.name,
        remoteActorId,
      )
      return { ap, remoteId }
    } catch (error) {
      console.error(`Error initializing Activitypub: ${error}`)
      throw error
    }
  }

  async handleActivities(item: any): Promise<VideoObject | undefined> {
    if (
      item.type === 'Announce' &&
      typeof item.object === 'string' &&
      item.actor.endsWith(this.user)
    ) {
      return this._fetchAs<VideoObject>(item.object)
    } else if (item.type === 'Create' && item.object !== undefined) {
      return this._fetchAs<VideoObject>((item.object as VideoObject).id)
    } else if (
      item.type === 'Update' &&
      item.object &&
      item.object.type === 'Video'
    ) {
      return this._fetchAs<VideoObject>((item.object as VideoObject).id)
    } else {
      return undefined
    }
  }

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    let cursor: Cursor
    if (cursorString) {
      cursor = parseCursor(cursorString, { direction: 'back', pageNumber: 1 })
    } else {
      cursor = {
        lastIngest: new Date(),
        direction: 'back',
        pageNumber: 1,
      }
    }
    const { ap, remoteId } = await this.getAndInitAp()
    const profile = remoteId

    // we have a previous cursor. ingest updates that were pushed to our inbox.
    if (cursor.direction === 'front') {
      try {
        const activities = await ap.getActivitiesForRemoteActor(
          profile,
          cursor.lastIngest,
        )
        if (!activities.length) {
          return { cursor: JSON.stringify(cursor), records: [] }
        }
        // map activities to source records
        const items = await Promise.all(
          activities.map((item) => this.handleActivities(item)),
        )
        const newVideoObjects = items.filter(
          (item): item is VideoObject => !!item,
        )
        if (!newVideoObjects.length) {
          return { cursor: JSON.stringify(cursor), records: [] }
        }
        cursor.lastIngest = new Date()
        const records: SourceRecordForm[] = [
          {
            body: JSON.stringify(newVideoObjects),
            contentType: 'application/json',
            sourceType: 'videoObjects',
            sourceUri: this.account + '#' + cursor.lastIngest.toISOString(),
          },
        ]
        return {
          cursor: JSON.stringify(cursor),
          records,
        }
      } catch (error) {
        console.error(`Error fetching updates: ${error}`)
        throw error
      }
      // we do not have a previous cursor. ingest history by fetching everything from the actor's outbox
    } else {
      // First ingest: save channel as ContentGrouping
      const channelInfo: ChannelInfo = { account: this.account }
      const channelSourceRecord = {
        body: JSON.stringify(channelInfo),
        contentType: 'application/json',
        sourceType: 'activityPubChannel',
        sourceUri: this._uri('account', this.account),
      }

      try {
        const outbox =
          profile && (await this._fetchAs<OutBox>(`${profile}/outbox`))
        const firstPageUrl = outbox && outbox.first
        if (!firstPageUrl) {
          throw new Error(
            `Could not find first page of outbox ${profile}/outbox`,
          )
        }
        // collect new video entities
        const newVideoObjects: VideoObject[] = []
        // start with first page
        const pageNumber = cursor.pageNumber
        const currentPageUrl = firstPageUrl.replace(
          'page=1',
          `page=${pageNumber}`,
        )
        log.debug(`AP ingest backwards page ${pageNumber}: ${currentPageUrl}`)
        const currentPage = await this._fetchAs<Page>(currentPageUrl)

        // loop over pages while there are still items on the page
        if (currentPage && currentPage.orderedItems.length !== 0) {
          cursor.pageNumber += 1
          const items = await Promise.all(
            currentPage.orderedItems.map((item) => this.handleActivities(item)),
          )
          if (items === undefined) {
            throw new Error(
              `Could not catch items under url ${currentPageUrl}.`,
            )
          }
          // collect items that are not undefined
          newVideoObjects.push(
            ...items.filter((item): item is VideoObject => !!item),
          )
        } else {
          cursor.direction = 'front'
        }

        // save collected items as source records
        let records: SourceRecordForm[] = []
        if (newVideoObjects.length) {
          records = [
            {
              body: JSON.stringify(newVideoObjects),
              contentType: 'application/json',
              sourceType: 'videoObjects',
              sourceUri: this.account + '#' + cursor.lastIngest.toISOString(),
            },
          ]
        }
        if (channelSourceRecord !== undefined) {
          records.push(channelSourceRecord as SourceRecordForm)
        }
        log.debug(`AP ingest done - next cursor ${JSON.stringify(cursor)}`)
        return {
          cursor: JSON.stringify(cursor),
          records,
        }
      } catch (error) {
        console.error(`Error fetching updates: ${error}`)
        throw error
      }
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

  private _mapSubtitleLanguageToSubtitlesEntity(
    subtitleLanguage: ActivityIdentifierObject,
    mediaAssetUri: string,
  ): EntityForm[] | null {
    const entities = []
    // parse subtitleLanguage input
    if (subtitleLanguage.url === undefined || subtitleLanguage.url === '') {
      return null
    }
    const url = subtitleLanguage.url
    const languageCode = subtitleLanguage.identifier
    const mimeType = url.endsWith('vtt')
      ? 'text/vtt'
      : 'application/octet-stream'
    // create uris for Subtitles Entity and File
    const subtitlesEntityUri = this._uri('subtitles', url)
    const fileUri = this._uri('file', url)
    // create File entity
    const subtitleFile: form.FileInput = {
      contentUrl: url,
      mimeType,
    }
    const fileEntity: EntityForm = {
      type: 'File',
      content: subtitleFile,
      headers: { EntityUris: [fileUri] },
    }
    entities.push(fileEntity)
    // create Subtitles entity
    const subtitles: form.TranscriptInput = {
      language: languageCode,
      subtitleUrl: fileUri,
      text: '',
      engine: 'engine',
      MediaAsset: { uri: mediaAssetUri },
      license: '',
      author: '',
    }
    const subtitlesEntity: EntityForm = {
      type: 'Transcript',
      content: subtitles,
      headers: { EntityUris: [subtitlesEntityUri] },
    }
    entities.push(subtitlesEntity)
    return entities
  }

  private _mapImagesToFileEntity(teaserImage: ActivityIconObject): EntityForm {
    const resolution =
      teaserImage.width && teaserImage.height
        ? teaserImage.height.toString() + 'x' + teaserImage.width.toString()
        : null
    const fileUri = this._uri('imageFile', teaserImage.url)
    const imageFile: form.FileInput = {
      contentUrl: teaserImage.url,
      mimeType: teaserImage.mediaType,
      resolution: resolution,
    }
    const fileEntity: EntityForm = {
      type: 'File',
      content: imageFile,
      headers: { EntityUris: [fileUri] },
    }
    return fileEntity
  }

  private _mapTagToConceptEntity(tag: ActivityHashTagObject): EntityForm {
    var nameJson: { [k: string]: any } = {}
    nameJson['de'] = { value: tag.name }
    const concept: ConceptInput = {
      kind: 'TAG',
      name: nameJson,
      description: {},
      summary: {},
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
    var nameJson: { [k: string]: any } = {}
    nameJson['de'] = { value: category.name }
    const concept: form.ConceptInput = {
      kind: 'CATEGORY',
      name: nameJson,
      description: {},
      summary: {},
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
    const files = []
    const entities = []

    // create Files for videos in "url"
    const videoUrls: ActivityVideoUrlObject[] = []
    // Depending on the transcoding peertube stores the videos in different locations of the videoObject
    const webVideos = video.url.filter(
      (url) => url.mediaType && url.mediaType.startsWith('video'),
    ) as ActivityVideoUrlObject[]
    if (webVideos.length) {
      // Web Video transcoding enabled
      videoUrls.push(...webVideos)
    } else {
      // HLS transcoding enabled
      const hlsLink = video.url.find((url) =>
        url.mediaType?.endsWith('x-mpegURL'),
      ) as ActivityHlsPlaylistUrlObject
      const hlsUrls =
        hlsLink &&
        (hlsLink.tag.filter(
          (url) =>
            url.type === 'Link' &&
            url.mediaType &&
            url.mediaType.startsWith('video'),
        ) as ActivityVideoUrlObject[])
      if (hlsUrls && hlsUrls.length) {
        videoUrls.push(...hlsUrls)
      }
    }
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
    if (video.icon !== undefined && video.icon.length >= 1) {
      const teaserImage = this._findLargestTeaserImage(video.icon)
      const imageFileEntity = this._mapImagesToFileEntity(teaserImage)
      entities.push(imageFileEntity)
      teaserImageUri = this._uri('imageFile', teaserImage.url)
      teaserImageUri && files.push({ uri: teaserImageUri })
    }

    // transform video.category and video.tags into Concepts
    const conceptUris = []
    if (video.category !== undefined) {
      const categoryConcept = this._mapCategoryToConceptEntity(video.category)
      entities.push(...categoryConcept)
      const categoryUri = this._uri(
        'category',
        'peertube:' + video.category.name,
      )
      conceptUris.push({ uri: categoryUri })
    }
    if (video.tag !== undefined) {
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

    // transform video.subtitleLanguage into Subtitles Entities and Files
    if (video.subtitleLanguage !== undefined) {
      const subtitleEntities =
        video.subtitleLanguage
          .map((subtitle) =>
            this._mapSubtitleLanguageToSubtitlesEntity(subtitle, mediaAssetUri),
          )
          .flat()
          .filter(notEmpty) ?? []
      subtitleEntities && entities.push(...subtitleEntities)
    }

    var titleJson: { [k: string]: any } = {}
    titleJson[video.language?.name || 'de'] = { value: video.name }
    var descriptionJson: { [k: string]: any } = {}
    descriptionJson[video.language?.name || 'de'] = { value: video.content }

    const asset: form.MediaAssetInput = {
      title: titleJson,
      description: descriptionJson,
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
        this._uriLink('category', 'peertube:' + video.category.name)
      category && conceptLinks.push(category)

      const tags =
        video.tag
          ?.map((tag) => this._uriLink('tags', tag.href ? tag.href : tag.name))
          .filter(notEmpty) ?? []
      conceptLinks.push(...tags)
      var lang = video.language?.name || 'de'
      if (lang.length > 2) {
        lang = lang.toLowerCase().slice(0, 2)
      }
      // var summaryJson: { [k: string]: any } = {}
      // summaryJson[''] = { value: '' }
      var titleJson: { [k: string]: any } = {}
      titleJson[lang] = { value: video.name }
      var contentJson: { [k: string]: any } = {}
      contentJson[lang] = {
        value: video.content,
      }

      var contentUrlsJson: { [k: string]: any } = {}
      contentUrlsJson[lang] = {
        value: video.url[0]['href'] || 'missing',
      }

      const content: form.ContentItemInput = {
        title: titleJson,
        subtitle: {},
        pubDate: new Date(video.published),
        content: contentJson,
        contentFormat: video.mediaType, // "text/markdown"
        // licenseUid TODO: plan to abolish License table and add license as string plus license_details
        Concepts: conceptLinks,
        //Contributions
        //License
        MediaAssets: mediaAssetUris,
        PrimaryGrouping: this._uriLink('account', this.account),
        summary: {},
        contentUrl: contentUrlsJson,
        originalLanguages: {},
        removed: false,
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
      var titleJson: { [k: string]: any } = {}
      titleJson['de'] = { value: channelInfo.account }
      const contentGrouping: form.ContentGroupingInput = {
        title: titleJson,
        variant: ContentGroupingVariant.EPISODIC, // @Frando is this used as intended?
        groupingType: 'activityPubChannel',
        description: {},
        summary: {},
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
