import { CbaDataSourcePlugin } from './cba.js'
import { RssDataSourcePlugin } from './rss.js'
import { XrcbDataSourcePlugin } from './xrcb.js'
import { DataSourcePluginRegistry } from '../plugins.js'

export const plugins = new DataSourcePluginRegistry()

plugins.register(new CbaDataSourcePlugin())
plugins.register(new RssDataSourcePlugin())
plugins.register(new XrcbDataSourcePlugin())
