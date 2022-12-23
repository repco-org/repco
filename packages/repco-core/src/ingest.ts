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

export type WorkOpts = {
  pollInterval?: number
}

export class Ingester {
  interval = 1000 * 60
  plugins: DataSourcePluginRegistry
  repo: Repo
  hydrated = false
  constructor(plugins: DataSourcePluginRegistry, repo: Repo) {
    this.plugins = plugins
    this.repo = repo
  }

  get datasources(): DataSourceRegistry {
    return this.repo.dsr
  }

  async init() {
    if (this.hydrated) return
    await this.repo.dsr.hydrate(this.repo.prisma, this.plugins)
    this.hydrated = true
  }

  async ingest(uid: string, wait?: number) {
    if (!this.hydrated) await this.init()
    const ds = this.datasources.get(uid)
    if (!ds)
      return {
        uid,
        ok: false,
        finished: true,
        error: new Error(`Datasource \`${uid}\` not found`),
      }
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait))
    try {
      const res = await ingestUpdatesFromDataSource(this.repo, ds)
      const finished = res.count === 0
      return { uid, ok: true, finished, ...res }
    } catch (error) {
      return { uid, ok: false, finished: true, error }
    }
  }

  async ingestAll() {
    if (!this.hydrated) await this.init()
    return await Promise.all(
      this.datasources.ids().map((uid) => this.ingest(uid)),
    )
  }

  async *workLoop(opts: WorkOpts = {}) {
    if (!this.hydrated) await this.init()
    const pending = new Map(
      this.datasources.ids().map((uid) => [uid, this.ingest(uid)]),
    )
    while (pending.size) {
      const res = await Promise.race(pending.values())
      yield res
      pending.delete(res.uid)
      if (res.ok) {
        const wait = res.finished
          ? opts.pollInterval || POLL_INTERVAL
          : undefined
        pending.set(res.uid, this.ingest(res.uid, wait))
      }
    }
  }
}
