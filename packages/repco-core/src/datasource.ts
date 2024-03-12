import { EventEmitter } from 'node:events'
import { createLogger } from 'repco-common'
import { EntityForm } from './entity.js'
import { IngestOutcome, IngestState } from './ingest.js'
import { DataSourcePluginRegistry } from './plugins.js'
import { Prisma, PrismaCore, SourceRecord } from './prisma.js'
import { Repo } from './repo.js'
import { tryCatch } from './util/error.js'
import { createRandomId, createSourceRecordId } from './util/id.js'
import { notEmpty } from './util/misc.js'
import { Registry } from './util/registry.js'

export const log = createLogger('ingest')

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

export type FetchUpdatesResult = {
  cursor: string
  records: SourceRecordForm[]
}

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
   * Fetches a record from the data source by its entity URI (URI).
   *
   * @param uri - The URI of the record to fetch.
   * @returns A `Promise` that resolves to the fetched record, or `null` if no record was found.
   */
  fetchByUri(uri: string): Promise<SourceRecordForm[] | null>
  fetchByUriBatch(
    uris: string[],
  ): Promise<{ sourceRecords: SourceRecordForm[]; errors?: Error[] }>
  /**
   * Determines whether the data source is capable of fetching records by UID.
   *
   * @param uid - The UID of the record to fetch.
   * @returns `true` if the tsdata source can fetch the record, `false` otherwise.
   */
  canFetchUri(uri: string): boolean
  /**
   * Maps a record from the data source to the corresponding entity form.
   *
   * @param record - The record to map.
   * @returns A `Promise` that resolves to the mapped entity form.
   */
  mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]>
}

export abstract class BaseDataSource implements DataSource {
  get config(): any {
    return null
  }

  abstract get definition(): DataSourceDefinition
  abstract fetchByUri(uid: string): Promise<SourceRecordForm[] | null>
  abstract mapSourceRecord(record: SourceRecordForm): Promise<EntityForm[]>

  get uid() {
    return this.definition.uid
  }

  async fetchByUriBatch(uris: string[]) {
    const errors: Error[] = []
    const res = await Promise.all(
      uris.map(async (uri) => {
        try {
          return await this.fetchByUri(uri)
        } catch (err) {
          errors.push(err as Error)
          return []
        }
      }),
    )
    const sourceRecords = res.filter(notEmpty).flat()
    return { sourceRecords, errors }
  }

  canFetchUri(_uid: string): boolean {
    return false
  }
  async fetchUpdates(_cursor: string | null): Promise<FetchUpdatesResult> {
    return { cursor: '', records: [] }
  }

  async getErrors(repo: Repo, opts: GetErrorOpts = { take: 100 }) {
    const where: Prisma.IngestErrorWhereInput = {
      repoDid: repo.did,
      datasourceUid: this.definition.uid,
    }
    const data = repo.prisma.ingestError.findMany({
      take: opts.take,
      skip: opts.skip,
      where,
    })
    return data
  }
}

export type GetErrorOpts = {
  take?: number
  skip?: number
}

type FailedHydrates = { err: Error; row: any }

// function errToSerializable(err: Error): Prisma.InputJsonValue {
//   return Object.fromEntries(Object.entries(err))
// }

export class DataSourceRegistry extends Registry<DataSource> {
  _hydrating?: Promise<{ failed: FailedHydrates[] }>
  public events: EventEmitter = new EventEmitter()

  allForUri(urn: string): DataSource[] {
    return this.filtered((ds) => ds.canFetchUri(urn))
  }

  async fetchEntities(repo: Repo, uris: string[]) {
    const fetched: EntityForm[] = []
    const notFound = new Set<string>()
    const found = new Set<string>()
    const buckets: Record<string, string[]> = {}
    for (const uri of uris) {
      const matchingSources = this.allForUri(uri)
      for (const ds of matchingSources) {
        const uid = ds.definition.uid
        if (!buckets[uid]) buckets[uid] = []
        buckets[uid].push(uri)
      }
    }

    for (const [uid, uris] of Object.entries(buckets)) {
      const filteredUris = uris.filter((uri) => !found.has(uri))
      // checked above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const ds = this.get(uid)!
      try {
        const { err, res } = await tryCatch(
          async () => await ds.fetchByUriBatch(filteredUris),
          (cause) => IngestError.atFetchUpdates(cause, repo, ds),
        )
        if (!res) {
          throw err
        }
        const { sourceRecords, errors: fetchErrors } = res
        if (fetchErrors) {
          for (const cause of fetchErrors) {
            const error = IngestError.atFetchUpdates(cause, repo, ds)
            await error.persist(repo.prisma)
          }
        }
        const { entities, errors } = await persistAndMapSourceRecords(
          repo,
          ds,
          sourceRecords,
        )
        for (const error of errors) {
          await error.persist(repo.prisma)
        }
        for (const e of entities) {
          e.headers?.EntityUris?.forEach((uri) => found.add(uri))
        }
        fetched.push(...entities)
      } catch (err) {
        if (!(err instanceof IngestError)) throw err
        await err.persist(repo.prisma)
      }
    }
    for (const uri of uris) {
      if (!found.has(uri)) notFound.add(uri)
    }
    return { fetched, notFound: Array.from(notFound) }
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

  async hydrate(
    prisma: PrismaCore,
    plugins: DataSourcePluginRegistry,
    repoDid: string,
  ) {
    if (!this._hydrating) {
      this._hydrating = (async () => {
        const rows = await prisma.dataSource.findMany({ where: { repoDid } })
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
    repoDid: string,
  ) {
    const instance = this.registerFromPlugins(plugins, pluginUid, config)
    const data = {
      uid: instance.definition.uid,
      pluginUid,
      config,
      repoDid,
    }
    await prisma.dataSource.create({
      data,
    })
    log.info(`Created datasource ${data.uid} in repo ${data.repoDid}.`)
    this.events.emit('create', instance.definition.uid)
    return instance
  }
}

export enum IngestErrorScope {
  FetchUpdates = 'fetch_updates',
  MapRecord = 'map_record',
  SaveBatch = 'save_batch',
}

export class IngestError extends Error {
  public scope: IngestErrorScope
  public repoDid: string
  public datasourceUid: string
  public cursor?: string | null
  public sourceRecordId?: string
  public cause: any
  public nextCursor?: string
  public previousErrors?: IngestError[]
  public timestamp: Date

  toString() {
    let s = ''
    switch (this.scope) {
      case IngestErrorScope.FetchUpdates:
        s = `Failed to fetch updates. Reason: ${
          this.cause
        }, cursor: ${JSON.stringify(this.cursor)}`
        break
      case IngestErrorScope.MapRecord:
        s = `Failed to map source record. Reason: ${this.cause}, id: ${this.sourceRecordId}`
        break
      case IngestErrorScope.SaveBatch:
        s = `Failed to save entity batch. Reason: ${
          this.cause
        }, cursor: ${JSON.stringify(this.cursor)}`
        break
    }
    if (this.previousErrors?.length) {
      s += '\nPrevious errors: \n'
      for (const err of this.previousErrors) {
        s += '    ' + err.toString() + '\n'
      }
    }
    return s
  }

  constructor({
    scope,
    repoDid,
    datasourceUid,
    cursor,
    cause,
    sourceRecordId,
    nextCursor,
    previousErrors,
  }: {
    scope: IngestErrorScope
    repoDid: string
    datasourceUid: string
    cursor?: string | null
    nextCursor?: string
    cause: any
    sourceRecordId?: string
    previousErrors?: IngestError[]
  }) {
    super()
    if (cause instanceof Error) {
      this.stack = cause.stack
      this.message = cause.message
    } else {
      this.message = String(cause)
    }
    this.scope = scope
    this.repoDid = repoDid
    this.datasourceUid = datasourceUid
    this.cursor = cursor
    this.nextCursor = nextCursor
    this.cause = cause
    this.sourceRecordId = sourceRecordId
    this.previousErrors = previousErrors
    this.timestamp = new Date()
  }
  static atFetchUpdates(
    cause: any,
    repo: Repo,
    datasource: DataSource,
    cursor?: string | null,
  ) {
    return new IngestError({
      scope: IngestErrorScope.FetchUpdates,
      repoDid: repo.did,
      datasourceUid: datasource.definition.uid,
      cursor,
      cause,
    })
  }

  static atMapSourceRecord(
    cause: any,
    repo: Repo,
    datasource: DataSource,
    sourceRecordId?: string,
  ) {
    return new IngestError({
      scope: IngestErrorScope.MapRecord,
      repoDid: repo.did,
      datasourceUid: datasource.definition.uid,
      cause,
      sourceRecordId,
    })
  }

  static atSaveBatch(
    cause: any,
    repo: Repo,
    datasource: DataSource,
    cursor: string | null,
    nextCursor: string,
    previousErrors: IngestError[],
  ) {
    return new IngestError({
      scope: IngestErrorScope.SaveBatch,
      repoDid: repo.did,
      datasourceUid: datasource.definition.uid,
      cursor,
      cause,
      nextCursor,
      previousErrors,
    })
  }

  async persist(prisma: PrismaCore) {
    if (this.previousErrors?.length) {
      for (const error of this.previousErrors) {
        await error.persist(prisma)
      }
    }
    const id = createRandomId()
    const details: any = {
      stack: this.cause?.stack || this.stack,
      nextCursor: this.nextCursor,
    }
    const data = {
      id,
      repoDid: this.repoDid,
      datasourceUid: this.datasourceUid,
      kind: this.scope,
      cursor: this.cursor ? JSON.stringify(this.cursor) : undefined,
      sourceRecordId: this.sourceRecordId,
      timestamp: this.timestamp,
      errorMessage: this.toString(),
      errorDetails: details,
    }
    await prisma.ingestError.create({ data })
  }
}

export type IngestResult = Record<string, IngestOutcome>

export async function ingestUpdatesFromDataSources(
  repo: Repo,
): Promise<IngestResult> {
  const res: IngestResult = {}
  for (const ds of repo.dsr.all()) {
    const ret = await tryIngestUpdatesFromDataSource(repo, ds)
    res[ds.definition.uid] = ret
  }
  return res
}

async function tryIngestUpdatesFromDataSource(
  repo: Repo,
  datasource: DataSource,
): Promise<IngestOutcome> {
  const uid = datasource.definition.uid
  try {
    const { finished, nextCursor } = await ingestUpdatesFromDataSource(
      repo,
      datasource,
      true,
    )
    const details = { cursor: nextCursor }
    if (finished) {
      return new IngestOutcome(uid, IngestState.Finished, details)
    } else {
      return new IngestOutcome(uid, IngestState.Ready, details)
    }
  } catch (error) {
    // if the error is not an IngestError, it is a bug, and thus a fatal error
    if (!(error instanceof IngestError)) {
      return new IngestOutcome(uid, IngestState.FailedFatal, {
        error: error as Error,
      })
    }

    let state = IngestState.FailedAtIngest
    if (error.scope === IngestErrorScope.FetchUpdates) {
      state = IngestState.FailedAtFetch
    }
    return new IngestOutcome(uid, state, { error })
  }
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
  saveCursorOnFail: boolean,
) {
  const { uid } = datasource.definition
  const cursor = await fetchCursor(repo.prisma, datasource)
  log.debug(`ingest ${uid}: cursor ${JSON.stringify(cursor)}`)

  try {
    const { nextCursor, records, entities, errors } =
      await ingestUpdatesFromDataSourceAtCursor(repo, datasource, cursor)

    log.debug(
      `ingest ${uid}: ${records.length} records, ${entities.length} entities, ${errors.length} errors`,
    )

    const finished = records.length === 0
    if (errors) {
      for (const error of errors) {
        log.warn(`ingest ${uid}: skipped record - ${error.toString()}`)
        await error.persist(repo.prisma)
      }
    }
    await saveCursor(repo.prisma, datasource, nextCursor)
    return { finished, nextCursor }
  } catch (err) {
    if (!(err instanceof IngestError)) {
      throw err
    }
    log.error(`ingest ${uid}: ${err.toString()}`)
    const nextCursor = err.nextCursor
    if (saveCursorOnFail && nextCursor) {
      await saveCursor(repo.prisma, datasource, nextCursor)
    }
    await err.persist(repo.prisma)
    const finished = false
    return { finished, nextCursor }
  }
}

export async function ingestUpdatesFromDataSourceAtCursor(
  repo: Repo,
  datasource: DataSource,
  cursor: string | null,
) {
  const { res, err } = await tryCatch(
    async () => await datasource.fetchUpdates(cursor),
    (cause) => IngestError.atFetchUpdates(cause, repo, datasource, cursor),
  )
  if (!res) throw err
  const { cursor: nextCursor, records } = res
  if (records.length) {
    const { entities, errors } = await persistAndMapSourceRecords(
      repo,
      datasource,
      records,
    )
    try {
      await repo.saveBatch(entities) // TODO: Agent
      return { nextCursor, records, entities, errors }
    } catch (cause) {
      console.log('saveBatch failure', cause)
      const err = IngestError.atSaveBatch(
        cause,
        repo,
        datasource,
        cursor,
        nextCursor,
        errors,
      )
      throw err
    }
  } else {
    return { nextCursor, records, entities: [], errors: [] }
  }
}

// Take a batch of source records, map them to repco entities,
// save the source record into the database and return the entities.
//
// Important: Caller has to ensure that all source records have been
// created by the datasource passed into this function.
async function persistAndMapSourceRecords(
  repo: Repo,
  datasource: DataSource,
  sourceRecords: Array<SourceRecordForm & { uid?: string }>,
) {
  const entities = []
  const date = new Date()
  const errors = []
  for (const sourceRecord of sourceRecords) {
    let sourceRecordId = sourceRecord.uid
    try {
      if (!sourceRecordId) {
        sourceRecordId = createSourceRecordId()
        // save the source record to the database
        // this allows to potentially remap the source record
        // if the mapSourceRecord function of a datasource is improved over time
        await repo.prisma.sourceRecord.create({
          data: {
            uid: sourceRecordId,
            contentType: sourceRecord.contentType,
            body: sourceRecord.body,
            sourceType: sourceRecord.sourceType,
            sourceUri: sourceRecord.sourceUri,
            timestamp: date,
            dataSourceUid: datasource.definition.uid,
            containedEntityUris: [],
          },
        })
      }

      const entitiesFromSourceRecord = await datasource.mapSourceRecord(
        sourceRecord,
      )
      const containedEntityUris = entitiesFromSourceRecord
        .map((e) => e.headers?.EntityUris || [])
        .flat()

      await repo.prisma.sourceRecord.update({
        where: { uid: sourceRecordId },
        data: { containedEntityUris },
      })

      for (const entity of entitiesFromSourceRecord) {
        if (!entity.headers) entity.headers = {}
        entity.headers.DerivedFrom = sourceRecordId
      }

      entities.push(...entitiesFromSourceRecord)
    } catch (cause) {
      const error = IngestError.atMapSourceRecord(
        cause,
        repo,
        datasource,
        sourceRecordId,
      )
      errors.push(error)
    }
  }
  return { entities, errors }
}

// Recreate all entities originating from a particular DataSource
//
// This traverses all source records for a datasource and recreates entity revisions for each.
//
// This function can be used to apply changes in a datasources `mapSourcRecord` function to the actual data.
//
// If the `mapSourceRecord` function is unchanged since the source records were imported initially,
// it should not create any new revisions because the revision's content would be unchanged to the state in the database,
// thus produce identical revision body CIDs, which will be detected and no new revisions would be created.
//
// This is never called automatically. The CLI contains a command to trigger it manually.
// For now it should be considered experimental. Please do backups before.
export async function remapDataSource(
  repo: Repo,
  datasource: DataSource,
  batchSize = 10,
) {
  const dataSourceUid = datasource.definition.uid

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

    const { entities, errors } = await persistAndMapSourceRecords(
      repo,
      datasource,
      records,
    )
    // TODO: handle errors
    state.processedEntities += entities.length
    const ret = await repo.saveBatch(entities)
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
