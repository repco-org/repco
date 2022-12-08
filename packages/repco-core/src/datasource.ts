import { EntityForm } from './entity.js'
import { DataSourcePluginRegistry } from './plugins.js'
import { Prisma, PrismaCore } from './prisma.js'
import { Repo } from './repo.js'
import { Registry } from './util/registry.js'

export type { DataSourcePlugin } from './plugins.js'

type UID = string

export type SourceRecordForm = {
  sourceUri: string
  contentType: string
  body: string
  sourceType: string
  meta?: any
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
  fetchUpdates(cursor: string | null): Promise<FetchUpdatesResult>
  fetchByUri(uid: string): Promise<SourceRecordForm[] | null>
  canFetchUri(uid: string): boolean
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

  async fetchEntities(uris: string[]) {
    const fetched: EntityForm[] = []
    const notFound = uris
    for (const uri of uris) {
      const matchingSources = this.allForUri(uri)
      let found = false
      for (const datasource of matchingSources) {
        const sourceRecords = await datasource.fetchByUri(uri)
        if (sourceRecords && sourceRecords.length) {
          const entities = (
            await Promise.all(
              sourceRecords.map((sourceRecord) =>
                datasource.mapSourceRecord(sourceRecord),
              ),
            )
          ).flat()
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
  maxIterations = 1,
): Promise<IngestResult> {
  const res: IngestResult = {}
  for (const ds of repo.dsr.all()) {
    const ret = await ingestUpdatesFromDataSource(repo, ds, maxIterations)
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
  maxIterations = 1,
) {
  let count = 0
  let cursor = await fetchCursor(repo.prisma, datasource)
  while (--maxIterations >= 0) {
    const { cursor: nextCursor, records } = await datasource.fetchUpdates(
      cursor,
    )
    if (!records.length) break

    const entities = []
    for (const sourceRecord of records) {
      const entitiesFromSourceRecord = await datasource.mapSourceRecord(
        sourceRecord,
      )
      entities.push(...entitiesFromSourceRecord)
      // const containedEntityUris = entitiesFromSourceRecord.map(e => e.entityUris || []).flat()
    }

    await repo.saveBatch('me', entities) // TODO: Agent
    await saveCursor(repo.prisma, datasource, nextCursor)
    cursor = nextCursor
    count += entities.length
  }
  return {
    count,
    cursor,
  }
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
