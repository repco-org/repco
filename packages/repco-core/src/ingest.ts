import {
  DataSourceRegistry,
  ingestUpdatesFromDataSource,
} from './datasource.js'
import { EntityWithRevision } from './entity.js'
import { DataSourcePluginRegistry } from './plugins.js'
import { Repo } from './repo.js'

// export type WorkerConstructor
export enum WorkerStatus {
  Running = 'running',
  Stopped = 'stopped',
}

export abstract class Worker {
  constructor() { }
  abstract start(): Promise<void>
  // abstract status(): WorkerStatus
  async stop(): Promise<void> { }
}

export abstract class Indexer extends Worker {
  abstract onRevisions(revisions: EntityWithRevision[]): Promise<void>
}

export class Ingester extends Worker {
  interval = 1000 * 60
  plugins: DataSourcePluginRegistry
  repo: Repo
  constructor(plugins: DataSourcePluginRegistry, repo: Repo) {
    super()
    this.plugins = plugins
    this.repo = repo
  }

  get datasources(): DataSourceRegistry {
    return this.repo.dsr
  }

  async init() {
    await this.repo.dsr.hydrate(this.repo.prisma, this.plugins)
  }

  async start(): Promise<void> {
    await this.init()
    while (true) {
      console.log('start work...')
      await this.work()
      console.log('wait...')
      await new Promise((resolve) => setTimeout(resolve, this.interval))
    }
  }

  async work(): Promise<void> {
    const results = await Promise.all(
      this.datasources.all().map((ds) =>
        ingestUpdatesFromDataSource(this.repo, ds)
          .then((result) => ({ uid: ds.definition.uid, ok: false, ...result }))
          .catch((error) => ({ uid: ds.definition.uid, ok: false, error })),
      ),
    )
    console.log('results', results)
  }
}
