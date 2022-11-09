import { EntityBatch, EntityForm } from './entity.js'
import { Prisma } from './prisma.js'
import { Repo } from './repo.js'
import { UID } from './shared.js'

export type DataSourcePluginDefinition = {
  // The unique ID for this data source instance.
  uid: UID
  // The human-readable name of the data source instance (e.g. "CBA")
  name: string
}

export interface DataSourcePlugin<C = any> {
  createInstance(config: C): DataSource
  get definition(): DataSourcePluginDefinition
}

export class DataSourcePluginRegistry {
  private plugins: Record<string, DataSourcePlugin> = {}
  all(): DataSourcePlugin[] {
    return [...Object.values(this.plugins)]
  }
  register(plugin: DataSourcePlugin) {
    this.plugins[plugin.definition.uid] = plugin
  }
  createInstance(uid: string, config: any): DataSource {
    if (!this.plugins[uid]) {
      throw new Error(`Unknown data source plugin: ${uid}`)
    }
    return this.plugins[uid].createInstance(config)
  }
  has(uid: string): boolean {
    return !!this.plugins[uid]
  }
}

export type DataSourceDefinition = {
  // The unique ID for this data source instance.
  uid: UID
  // The human-readable name of the data source instance (e.g. "CBA")
  name: string
  // A primary endpoint URL for this data source.
  // url: string
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
  fetchUpdates(cursor: string | null): Promise<EntityBatch>
  fetchByUID(uid: string): Promise<EntityForm[] | null>
  canFetchUID(uid: string): boolean
}

interface PluginLike {
  definition: {
    uid: string
  }
}

export class Registry<T extends PluginLike> {
  map: Map<string, T> = new Map()

  get(uid: string): T | undefined {
    return this.map.get(uid)
  }

  all(): T[] {
    return [...this.map.values()]
  }

  register(item: T) {
    const uid = item.definition.uid
    this.map.set(uid, item)
  }

  filtered(fn: (p: T) => boolean): T[] {
    return [...this.map.values()].filter(fn)
  }

  // @deprecated
  getByUID(uid: string): T | null {
    return this.get(uid) || null
  }
}

export abstract class BaseDataSource {
  canFetchUID(_uid: string): boolean {
    return false
  }
  async fetchUpdates(_cursor: string | null): Promise<EntityBatch> {
    return { cursor: '', entities: [] }
  }
}

export class DataSourceRegistry extends Registry<DataSource> {
  getForUID(uid: string): DataSource[] {
    const matching = []
    for (const ds of this.map.values()) {
      if (ds.canFetchUID(uid)) {
        matching.push(ds)
      }
    }
    return matching
  }

  async fetchEntities(uris: string[]) {
    const fetched: EntityForm[] = []
    const notFound = uris
    for (const uri of uris) {
      const matchingSources = this.getForUID(uri)
      let found = false
      for (const datasource of matchingSources) {
        const entities = await datasource.fetchByUID(uri)
        if (entities && entities.length) {
          fetched.push(...entities)
          found = true
          break
        }
      }
      if (!found) notFound.push(uri)
    }
    return { fetched, notFound }
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
    // console.time('fetchUpdates:' + datasource.definition.uid)
    const batch: EntityBatch = await datasource.fetchUpdates(cursor)
    // console.timeEnd('fetchUpdates:' + datasource.definition.uid)
    if (!batch.entities.length) break
    count += batch.entities.length
    cursor = batch.cursor
    // console.time('saveUpdates:' + datasource.definition.uid)
    await repo.saveBatch('me', batch.entities) // TODO: Agent
    await saveCursor(repo.prisma, datasource, cursor)
    // console.timeEnd('saveUpdates:' + datasource.definition.uid)
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
  const state = await prisma.dataSource.findUnique({
    where: { uid: datasource.definition.uid },
  })
  let cursor = null
  if (state) {
    cursor = state.cursor
  }
  return cursor
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
  await prisma.dataSource.upsert({
    where: { uid: datasource.definition.uid },
    update: { cursor },
    create: {
      uid: datasource.definition.uid,
      pluginUid: datasource.definition.pluginUid,
      cursor,
    },
  })
}
