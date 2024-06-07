import { UntilStopped } from 'repco-common'
import {
  DataSourceRegistry,
  IngestError,
  IngestErrorScope,
  ingestUpdatesFromDataSource,
} from './datasource.js'
import { DataSourcePluginRegistry } from './plugins.js'
import { Repo } from './repo.js'

// export type WorkerConstructor
export enum WorkerStatus {
  Running = 'running',
  Stopped = 'stopped',
}

export enum IngestState {
  Cancelled = 'cancelled',
  Ready = 'ready',
  Finished = 'finished',
  FailedAtFetch = 'failed_fetch',
  FailedAtIngest = 'failed_ingest',
  FailedFatal = 'failed_fatal',
}

export class IngestOutcome {
  error?: Error
  cursor?: string

  constructor(
    public uid: string,
    public state: IngestState,
    details?: { error?: Error; cursor?: string },
  ) {
    this.error = details?.error
    this.cursor = details?.cursor
  }

  didFail(): boolean {
    return this.state.startsWith('failed_')
  }

  shouldContinue(): boolean {
    return (
      this.state !== IngestState.FailedFatal &&
      this.state !== IngestState.Cancelled
    )
  }
}

export class Ingester {
  // recheck finished datasources every 10 seconds
  waitAfterFinish = 1000 * 10
  // retry failed datasources every 30 seconds
  waitRetry = 1000 * 30
  plugins: DataSourcePluginRegistry
  repo: Repo
  hydrated = false
  untilStopped = new UntilStopped()

  constructor(plugins: DataSourcePluginRegistry, repo: Repo) {
    this.plugins = plugins
    this.repo = repo
  }

  get datasources(): DataSourceRegistry {
    return this.repo.dsr
  }

  async init() {
    if (this.hydrated) return
    await this.repo.dsr.hydrate(this.repo.prisma, this.plugins, this.repo.did)
    this.hydrated = true
  }

  async ingest(uid: string, wait?: number): Promise<IngestOutcome> {
    if (this.untilStopped.stopped) {
      return new IngestOutcome(uid, IngestState.Cancelled)
    }
    if (!this.hydrated) await this.init()
    const ds = this.datasources.get(uid)
    if (!ds) {
      const error = new Error(`Datasource \`${uid}\` not found`)
      return new IngestOutcome(uid, IngestState.FailedFatal, { error })
    }

    if (wait) await this.untilStopped.timeout(wait)

    if (this.untilStopped.stopped) {
      return new IngestOutcome(uid, IngestState.Cancelled)
    }

    try {
      const { finished, nextCursor } = await ingestUpdatesFromDataSource(
        this.repo,
        ds,
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

  async ingestAll() {
    if (!this.hydrated) await this.init()
    return await Promise.all(
      this.datasources.ids().map((uid) => this.ingest(uid)),
    )
  }

  stop() {
    this.untilStopped.stop()
  }

  get stopped() {
    return this.untilStopped.stopped
  }

  async *workLoop() {
    if (!this.hydrated) await this.init()
    const pending = new Map(
      this.datasources.ids().map((uid) => [uid, this.ingest(uid)]),
    )

    const onDsCreate = (uid: string) => {
      if (this.stopped) {
        this.repo.dsr.events.removeListener('create', onDsCreate)
        return
      }
      console.log('added datasource to ingest', this.repo.did, uid)
      pending.set(uid, this.ingest(uid))
    }
    this.repo.dsr.events.on('create', onDsCreate)

    while (pending.size) {
      const res = await Promise.race(pending.values())
      yield res
      pending.delete(res.uid)

      if (!this.stopped && res.shouldContinue()) {
        let wait: number | undefined
        if (res.state === IngestState.FailedAtFetch) {
          wait = this.waitRetry
        } else if (res.state === IngestState.Finished) {
          wait = this.waitAfterFinish
        }
        pending.set(res.uid, this.ingest(res.uid, wait))
      }
    }
  }
}
