import { DataSource as DataSourceModel, PrismaClient } from "repco-prisma";
import { DataSourceConstructor, DataSourcePluginRegistry, DataSources, ingestUpdatesFromDataSource } from "./datasource.js";
import { Entity, EntityBatch, EntityRevision } from "./entity.js";

// export type WorkerConstructor
export enum WorkerStatus {
  Running = 'running',
  Stopped = 'stopped',
}

export type SharedState = {
  prisma: PrismaClient,
  dataSourcePluginRegistry: DataSourcePluginRegistry
}

export abstract class Worker<Conf = void> {
  private config: Conf
  constructor(config: Conf, protected state: SharedState) {
    this.config = config
  }
  abstract start(): Promise<void>
  // abstract status(): WorkerStatus
  async stop(): Promise<void> {}
}

export abstract class Indexer<Conf = void> extends Worker<Conf> {
  abstract onRevisions(revisions: EntityRevision[]): Promise<void>
}

export class Ingester extends Worker<void> {
  public datasources: DataSources
  constructor(config: void, state: SharedState) {
    super(config, state)
    this.datasources = new DataSources()
  }

  async start(): Promise<void> {
    const savedDataSources = await this.state.prisma.dataSource.findMany()
    for (const model of savedDataSources) {
      if (!this.state.dataSourcePluginRegistry.has(model.uid)) {
        console.error(
          `Skip init of data source ${model.uid}: Unknown plugin ${model.pluginUid}`,
        )
      }
      const ds = this.state.dataSourcePluginRegistry.createInstance(
        model.uid,
        model.config,
      )
      this.datasources.register(ds)
    }

    for (const ds of this.datasources.all()) {
      ingestUpdatesFromDataSource(this.state.prisma, this.datasources, ds)
    }
  }
}
