import zod from 'zod'
import { log } from 'repco-common'
import { ContentGroupingVariant, form } from 'repco-prisma'
import { ContentGroupingInput } from 'repco-prisma/generated/repco/zod.js'
import { fetch } from 'undici'
import { TransposerPost } from './transposer/types.js'
import {
  BaseDataSource,
  DataSource,
  DataSourceDefinition,
  DataSourcePlugin,
  FetchUpdatesResult,
  SourceRecordForm,
} from '../datasource.js'
import { EntityForm } from '../entity.js'
import { FetchOpts } from '../util/datamapping.js'
import { HttpError } from '../util/error.js'

export class TransposerDataSourcePlugin implements DataSourcePlugin {
  createInstance(config: any) {
    const parsedConfig = configSchema.parse(config)
    return new TransposerDataSource(parsedConfig)
  }
  get definition() {
    return {
      uid: 'repco:datasource:transposer',
      name: 'Transposer',
    }
  }
}

const configSchema = zod.object({
  endpoint: zod.string().url(),
  repo: zod.string(),
})
type ConfigSchema = zod.infer<typeof configSchema>

export class TransposerDataSource extends BaseDataSource implements DataSource {
  endpoint: URL
  baseUri: string
  uriPrefix: string
  repo: string
  constructor(config: ConfigSchema) {
    super()
    const endpoint = new URL(config.endpoint)
    endpoint.hash = ''
    this.endpoint = endpoint
    this.baseUri = removeProtocol(this.endpoint)
    this.repo = config.repo
    this.uriPrefix = `repco:transposer:${this.endpoint.host}`
  }

  get config() {
    return { endpoint: this.endpoint.toString() }
  }

  get definition(): DataSourceDefinition {
    const uid = this.repo + ':' + this.baseUri
    return {
      name: 'Transposer data source',
      uid,
      pluginUid: 'repco:datasource:transposer',
    }
  }

  async fetchByUri(uri: string): Promise<SourceRecordForm[]> {
    if (uri === this.endpoint.toString()) {
      const body = await this.fetchPage(this.endpoint)
      return [
        {
          sourceType: 'transposer',
          contentType: 'application/json',
          sourceUri: uri,
          body,
        },
      ]
    }
    return []
  }

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

  async fetchUpdates(cursorString: string | null): Promise<FetchUpdatesResult> {
    try {
      const cursor = cursorString ? JSON.parse(cursorString) : {}
      const {
        page: pageCursor = 1,
        modified: modifiedCursor = '1970-01-01T01:00:00',
      } = cursor
      const perPage = 100
      const url =
        this.endpoint + `?per_page=${perPage}&page=${pageCursor}&order=asc`

      var items = await this._fetch<TransposerPost[]>(url)
      items = items.filter(
        (item) =>
          new Date(item.contentItem.modifiedDate) >= new Date(modifiedCursor),
      )

      cursor.modified =
        items?.[items.length - 1]?.contentItem.modifiedDate || cursor.modified
      if (!cursor.page) {
        cursor.page = 1
      }
      if (items.length === perPage) {
        cursor.page += 1
      }

      return {
        cursor: JSON.stringify(cursor),
        records: [
          {
            body: JSON.stringify(items),
            contentType: 'application/json',
            sourceType: 'page',
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
      const entities: EntityForm[] = []

      // ContentGrouping
      var titleJson: { [k: string]: any } = {}
      titleJson['en'] = {
        value: this.repo,
      }
      var summaryJson: { [k: string]: any } = {}
      summaryJson['en'] = {
        value: '',
      }
      var descriptionJson: { [k: string]: any } = {}
      descriptionJson['en'] = {
        value: this.endpoint.toString(),
      }

      // TODO: map from fetch und wenn leer -> relation löschen
      const contentGrouping: ContentGroupingInput = {
        groupingType: 'page',
        title: titleJson,
        variant: ContentGroupingVariant.EPISODIC,
        description: descriptionJson,
        summary: summaryJson,
      }

      entities.push({
        type: 'ContentGrouping',
        content: contentGrouping,
        headers: {
          RevisionUris: [
            this._revisionUri('grouping', this.repo, new Date().getTime()),
          ],
          EntityUris: [this.endpoint.toString()],
        },
      })

      for (let index = 0; index < body.length; index++) {
        const element = body[index]
        const mediaAssetLinks = []
        const conceptLinks = []

        // MediaAsset
        for (let i = 0; i < element.mediaAssets.length; i++) {
          const mediaAsset = element.mediaAssets[i]
          const fileLinks = []

          // Files for MediaAsset
          for (let j = 0; j < mediaAsset.files.length; j++) {
            const file = mediaAsset.files[j]
            const fileEntity: form.FileInput = {
              contentUrl: file.contentUrl,
              contentSize: file.contentSize,
              mimeType: file.mimeType,
              cid: null,
              resolution: file.resolution,
            }

            entities.push({
              type: 'File',
              content: fileEntity,
              headers: { EntityUris: [this._uri('file', file.contentUrl)] },
            })

            fileLinks.push({ uri: this._uri('file', file.contentUrl) })
          }
          const mediaConceptLinks = []

          // Concepts for MediaAsset
          for (let j = 0; j < mediaAsset.concepts.length; j++) {
            const concept = mediaAsset.concepts[j]
            const conceptEntity: form.ConceptInput = {
              name: concept.name,
              description: concept.description,
              kind: concept.kind,
              originNamespace: this.endpoint.toString(),
              summary: {},
              ParentConcept:
                concept.id !== concept.parent
                  ? { uri: this._uri(concept.kind, concept.parent) }
                  : null,
            }

            entities.push({
              type: 'Concept',
              content: conceptEntity,
              headers: {
                RevisionUris: [
                  this._revisionUri(
                    concept.kind,
                    concept.id,
                    new Date().getTime(),
                  ),
                ],
                EntityUris: [this._uri(concept.kind, concept.id)],
              },
            })

            mediaConceptLinks.push({ uri: this._uri(concept.kind, concept.id) })
          }

          const mediaAssetEntity: form.MediaAssetInput = {
            title: mediaAsset.title,
            description: mediaAsset.content,
            mediaType: mediaAsset.mediaType,
            Concepts: mediaConceptLinks,
            Files: fileLinks,
          }

          entities.push({
            type: 'MediaAsset',
            content: mediaAssetEntity,
            headers: {
              EntityUris: [this._uri(mediaAsset.mediaType, mediaAsset.ID)],
            },
          })
          mediaAssetLinks.push({
            uri: this._uri(mediaAsset.mediaType, mediaAsset.ID),
          })
        }

        for (let i = 0; i < element.contentItem.concepts.length; i++) {
          const concept = element.contentItem.concepts[i]
          const conceptEntity: form.ConceptInput = {
            name: concept.name,
            description: concept.description,
            kind: concept.kind,
            originNamespace: this.endpoint.toString(),
            summary: {},
            ParentConcept:
              concept.id !== concept.parent
                ? { uri: this._uri(concept.kind, concept.parent) }
                : null,
          }

          entities.push({
            type: 'Concept',
            content: conceptEntity,
            headers: {
              RevisionUris: [
                this._revisionUri(
                  concept.kind,
                  concept.id,
                  new Date().getTime(),
                ),
              ],
              EntityUris: [this._uri(concept.kind, concept.id)],
            },
          })

          conceptLinks.push({ uri: this._uri(concept.kind, concept.id) })
        }

        // ContentItem
        const content: form.ContentItemInput = {
          pubDate: parseAsUTC(element.contentItem.pubDate),
          content: element.contentItem.content,
          contentFormat: 'text/html',
          title: element.contentItem.title,
          subtitle: element.contentItem.subtitle || '',
          summary: element.contentItem.summary,
          PublicationService: null, //this._uriLink('station', this.baseUri),
          Concepts: conceptLinks,
          MediaAssets: mediaAssetLinks,
          PrimaryGrouping: { uri: this.endpoint.toString() },
          contentUrl: element.contentItem.contentUrl,
          originalLanguages: element.contentItem.originalLanguages,
          License: null,
          removed: false,
        }

        const revisionId = this._revisionUri(
          'contentItem',
          element.contentItem.ID,
          parseAsUTC(element.contentItem.modifiedDate).getTime(),
        )
        const entityUri = this._uri('contentItem', element.contentItem.ID)

        const headers = {
          RevisionUris: [revisionId],
          EntityUris: [entityUri],
        }

        entities.push({ type: 'ContentItem', content, headers })
      }

      return entities
    } catch (error) {
      throw new Error(`Error body undefined: ${error}`)
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

  private async _fetch<T = any>(
    urlString: string,
    opts: FetchOpts = {},
  ): Promise<T> {
    const url = new URL(urlString)
    // if (this.config.apiKey) {
    //   url.searchParams.set('api_key', this.config.apiKey)
    // }
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

function removeProtocol(inputUrl: string | URL) {
  try {
    const url = new URL(inputUrl)
    return url.toString().replace(url.protocol + '//', '')
  } catch (err) {
    return inputUrl.toString()
  }
}

function parseAsUTC(dateString: string): Date {
  const convertedDate = new Date(dateString + '.000Z')
  return convertedDate
}
