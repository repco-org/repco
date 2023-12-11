import { UntilStopped } from 'repco-common'
import {
  DataSourceRegistry,
  ingestUpdatesFromDataSource,
} from './datasource.js'
import { DataSourcePluginRegistry } from './plugins.js'
import { Repo } from './repo.js'

// export type WorkerConstructor
export enum WorkerStatus {
  Running = 'running',
  Stopped = 'stopped',
}

const POLL_INTERVAL = 10000

const stopped = (uid: string) => ({
  uid,
  ok: true,
  finished: false,
  canclled: true,
})
const errored = (uid: string, error: Error | any) => ({
  uid,
  ok: false,
  finished: true,
  error: error instanceof Error ? error : new Error(String(error)),
})

export type WorkOpts = {
  pollInterval?: number
}

export class Ingester {
  interval = 1000 * 60
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

  async ingest(uid: string, wait?: number) {
    if (this.untilStopped.stopped) return stopped(uid)
    if (!this.hydrated) await this.init()
    const ds = this.datasources.get(uid)
    if (!ds) return errored(uid, new Error(`Datasource \`${uid}\` not found`))
    if (wait) await this.untilStopped.timeout(wait)
    if (this.untilStopped.stopped) return stopped(uid)
    try {
      const res = await ingestUpdatesFromDataSource(this.repo, ds)
      const finished = res.count === 0
      return { uid, ok: true, finished, ...res }
    } catch (error) {
      return errored(uid, error)
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

  async *workLoop(opts: WorkOpts = {}) {
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
      if (res.ok && !this.stopped) {
        const wait = res.finished
          ? opts.pollInterval || POLL_INTERVAL
          : undefined
        pending.set(res.uid, this.ingest(res.uid, wait))
      }
    }
  }
}
