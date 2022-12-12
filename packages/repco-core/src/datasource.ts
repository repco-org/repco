import { EntityForm } from './entity.js'
import { DataSourcePluginRegistry } from './plugins.js'
import { Prisma, PrismaCore, SourceRecord } from './prisma.js'
import { Repo } from './repo.js'
import { createSourceRecordId } from './util/id.js'
import { Registry } from './util/registry.js'

export type { DataSourcePlugin } from './plugins.js'

type UID = string

const kParsedBody = Symbol.for('parsedBody')
type ParseBodyFn<T> = (form: SourceRecordForm) => Promise<T>

export async function parseBodyCached<T>(
  form: SourceRecordForm,
  parserFn: ParseBodyFn<T>,
) {
  let parsedBody = getParsedBody(form)
  if (!parsedBody) {
    parsedBody = await parserFn(form)
    setParsedBody(form, parsedBody)
  }
  return parsedBody as T
}
export function setParsedBody(form: SourceRecordForm, parsedBody: any) {
  form[kParsedBody] = parsedBody
}
export function getParsedBody(form: SourceRecordForm): undefined | any {
  return form[kParsedBody]
}

export type SourceRecordForm = {
  sourceUri: string
  contentType: string
  body: string
  sourceType: string
  meta?: any
  [kParsedBody]?: any
}

export type FetchUpdatesResult = { cursor: string; records: SourceRecordForm[] }

export type DataSourceDefinition = {
  // The unique ID for this data source instance.
  uid: UID
  // The human-readable name of the data source instance (e.g. "CBA")
  name: string
  // The plugin that handles this datasource
  pluginUid: UID
}

/**
 * A DataSource is an external provider for repco data.
 *
 * The interface is implemented for individual providers (like CBA, XRCB, media.cccc.de).
 * The DataSource includes methods to fetch data from the external source
 * and converts this data into the repco data model.
 */
export interface DataSource {
  get definition(): DataSourceDefinition
  get config(): any
  /**
   * Fetches updates from the data source.
   *
   * @param cursor - The cursor that points to the position from where updates should be fetched.
   *                 If this value is `null`, updates should be fetched from the beginning.
   * @returns A `Promise` that resolves to the result of the fetch operation.
   */
  fetchUpdates(cursor: string | null): Promise<FetchUpdatesResult>
  /**
   * Fetches a record from the data source by its unique identifier (UID).
   *
   * @param uid - The UID of the record to fetch.
   * @returns A `Promise` that resolves to the fetched record, or `null` if no record was found.
   */
  fetchByUri(uid: string): Promise<SourceRecordForm[] | null>
  /**
   * Determines whether the data source is capable of fetching records by UID.
   *
   * @param uid - The UID of the record to fetch.
   * @returns `true` if the data source can fetch the record, `false` otherwise.
   */
  canFetchUri(uid: string): boolean
  /**
   * Maps a record from the data source to the corresponding entity form.
   *
   * @param record - The record to map.
   * @returns A `Promise` that resolves to the mapped entity form.
   */
  mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]>
}

export abstract class BaseDataSource {
  get config() {
    return null
  }
  canFetchUri(_uid: string): boolean {
    return false
  }
  async fetchUpdates(_cursor: string | null): Promise<FetchUpdatesResult> {
    return { cursor: '', records: [] }
  }
}

type FailedHydrates = { err: Error; row: any }

export class DataSourceRegistry extends Registry<DataSource> {
  _hydrating?: Promise<{ failed: FailedHydrates[] }>

  allForUri(urn: string): DataSource[] {
    return this.filtered((ds) => ds.canFetchUri(urn))
  }

  async fetchEntities(repo: Repo, uris: string[]) {
    const fetched: EntityForm[] = []
    const notFound = uris
    for (const uri of uris) {
      const matchingSources = this.allForUri(uri)
      let found = false
      for (const datasource of matchingSources) {
        const sourceRecords = await datasource.fetchByUri(uri)
        if (sourceRecords && sourceRecords.length) {
          const entities = await mapAndPersistSourceRecord(
            repo,
            datasource,
            sourceRecords,
          )
          fetched.push(...entities)
          found = true
          break
        }
      }
      if (!found) notFound.push(uri)
    }
    return { fetched, notFound }
  }

  registerFromPlugins(
    plugins: DataSourcePluginRegistry,
    pluginUid: string,
    config: any,
  ) {
    const instance = plugins.createInstance(pluginUid, config)
    if (this.has(instance.definition.uid)) {
      throw new Error(
        `Datasource with ${instance.definition.uid} already exists.`,
      )
    }
    return this.register(instance)
  }

  async hydrate(prisma: PrismaCore, plugins: DataSourcePluginRegistry) {
    if (!this._hydrating) {
      this._hydrating = (async () => {
        const rows = await prisma.dataSource.findMany()
        const failed = []
        for (const row of rows) {
          try {
            this.registerFromPlugins(plugins, row.pluginUid, row.config)
          } catch (err) {
            failed.push({ row, err: err as Error })
          }
        }
        return { failed }
      })()
    }
    return this._hydrating
  }

  async create(
    prisma: PrismaCore,
    plugins: DataSourcePluginRegistry,
    pluginUid: string,
    config: any,
  ) {
    const instance = this.registerFromPlugins(plugins, pluginUid, config)
    const data = {
      uid: instance.definition.uid,
      pluginUid,
      config,
    }
    await prisma.dataSource.create({
      data,
    })
    return instance
  }
}

export type IngestResult = Record<
  string,
  {
    count: number
    cursor: string | null
  }
>

export async function ingestUpdatesFromDataSources(
  repo: Repo,
): Promise<IngestResult> {
  const res: IngestResult = {}
  for (const ds of repo.dsr.all()) {
    const ret = await ingestUpdatesFromDataSource(repo, ds)
    res[ds.definition.uid] = ret
  }
  return res
}

/**
 * Fetch updates from a data source, using the cursor persisted
 * after the last invocation.
 * All updates will be persisted to the local database. After each
 * page of updates, the current cursor will be saved locally as well.
 * Set maxIterations to Infinity to fetch all updates until no more
 * updates are returned, then stop.
 */
export async function ingestUpdatesFromDataSource(
  repo: Repo,
  datasource: DataSource,
) {
  const cursor = await fetchCursor(repo.prisma, datasource)

  const { cursor: nextCursor, records } = await datasource.fetchUpdates(cursor)
  if (!records.length) return { cursor, count: 0 }

  const entities = await mapAndPersistSourceRecord(repo, datasource, records)
  await repo.saveBatch('me', entities) // TODO: Agent
  await saveCursor(repo.prisma, datasource, nextCursor)

  return {
    count: entities.length,
    cursor,
  }
}

// Take a batch of source records, map them to repco entities,
// save the source record into the database and return the entities.
//
// Important: Caller has to ensure that all source records have been
// created by the datasource passed into this function.
async function mapAndPersistSourceRecord(
  repo: Repo,
  datasource: DataSource,
  sourceRecords: Array<SourceRecordForm & { uid?: string }>,
) {
  const entities = []
  const date = new Date()
  for (const sourceRecord of sourceRecords) {
    const entitiesFromSourceRecord = await datasource.mapSourceRecord(
      sourceRecord,
    )
    const containedEntityUris = entitiesFromSourceRecord
      .map((e) => e.entityUris || [])
      .flat()

    let sourceRecordId = sourceRecord.uid
    if (!sourceRecordId) {
      sourceRecordId = createSourceRecordId()
      // save source record
      await repo.prisma.sourceRecord.create({
        data: {
          uid: sourceRecordId,
          contentType: sourceRecord.contentType,
          body: sourceRecord.body,
          sourceType: sourceRecord.sourceType,
          sourceUri: sourceRecord.sourceUri,
          timestamp: date,
          dataSourceUid: datasource.definition.uid,
          containedEntityUris,
        },
      })
    }

    for (const entity of entitiesFromSourceRecord) {
      entity.derivedFromUid = sourceRecordId
    }

    entities.push(...entitiesFromSourceRecord)
  }
  return entities
}

export async function remapDataSource(repo: Repo, datasource: DataSource) {
  const dataSourceUid = datasource.definition.uid
  const batchSize = 10

  let cursor: string | undefined = undefined
  const state = {
    savedRevisions: 0,
    processedSourceRecords: 0,
    processedEntities: 0,
  }
  while (true) {
    const records: SourceRecord[] = await fetchSourceRecords(
      repo.prisma,
      dataSourceUid,
      batchSize,
      cursor,
    )
    state.processedSourceRecords += 1
    if (!records.length) break

    const nextCursor = records[records.length - 1].uid
    if (nextCursor === cursor) break

    const entities = await mapAndPersistSourceRecord(repo, datasource, records)
    state.processedEntities += entities.length
    const ret = await repo.saveBatch('me', entities)
    if (ret) state.savedRevisions += ret.length

    cursor = nextCursor
  }
  return state
}

async function fetchSourceRecords(
  prisma: Prisma.TransactionClient,
  dataSourceUid: string,
  take: number,
  from?: string,
) {
  const skip = from ? 1 : 0
  const cursor = from ? { uid: from } : undefined
  const records = await prisma.sourceRecord.findMany({
    skip,
    where: { dataSourceUid },
    cursor,
    take,
    orderBy: { uid: 'asc' },
  })
  return records
}

/**
 * Returns a string which serves as a marker for the last fetch.
 * Usually this is a timestamp or something similar
 */
async function fetchCursor(
  prisma: Prisma.TransactionClient,
  datasource: DataSource,
): Promise<string | null> {
  const row = await prisma.dataSource.findUnique({
    where: { uid: datasource.definition.uid },
    select: { cursor: true },
  })
  return row?.cursor || null
}

/**
 * The cursor contains the information about the last fetch
 * from a datasource. You can take any marker but it makes
 * sense to take the last modified date or something similar.
 */
export async function saveCursor(
  prisma: Prisma.TransactionClient,
  datasource: DataSource,
  cursor: string,
) {
  const uid = datasource.definition.uid
  await prisma.dataSource.update({
    where: { uid },
    data: { cursor },
  })
}
