import { CbaDataSourcePlugin } from './cba.js'
import { RssDataSourcePlugin } from './rss.js'
import { DataSourcePluginRegistry } from '../plugins.js'

export const plugins = new DataSourcePluginRegistry()

plugins.register(new CbaDataSourcePlugin())
plugins.register(new RssDataSourcePlugin())
