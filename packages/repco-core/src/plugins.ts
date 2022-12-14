import type { DataSource } from './datasource.js'
import { Registry } from './util/registry.js'

type UID = string

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

export class DataSourcePluginRegistry extends Registry<DataSourcePlugin> {
  createInstance(pluginUid: string, config: any): DataSource {
    const plugin = this.get(pluginUid)
    if (!plugin) {
      throw new Error(`Unknown data source plugin: ${pluginUid}`)
    }
    return plugin.createInstance(config)
  }
}
