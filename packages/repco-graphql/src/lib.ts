import PgManyToManyPlugin from '@graphile-contrib/pg-many-to-many'
import SimplifyInflectorPlugin from '@graphile-contrib/pg-simplify-inflector'
import ConnectionFilterPlugin from 'postgraphile-plugin-connection-filter'
import { NodePlugin } from 'graphile-build'
import { postgraphile } from 'postgraphile'

// Change some inflection rules to better match our schema.
import CustomInflector from './plugins/inflector.js'
// Add custom tags to omit all queries for the relation tables
import CustomTags from './plugins/tags.js'
// Add a resolver wrapper to add default pagination args
import WrapResolversPlugin from './plugins/wrap-resolver.js'
import ExportSchemaPlugin from './plugins/export-schema.js'
export { getSDL } from './plugins/export-schema.js'

// Create an GraphQL express middleware with Postgraphile
// for a repco database.
export function createGraphqlHandler(databaseUrl: string) {
  return postgraphile(databaseUrl, 'repco', {
    graphiql: true,
    enhanceGraphiql: true,
    disableDefaultMutations: true,
    classicIds: true,
    skipPlugins: [NodePlugin],
    appendPlugins: [
      CustomTags,
      ConnectionFilterPlugin,
      PgManyToManyPlugin,
      SimplifyInflectorPlugin,
      CustomInflector,
      WrapResolversPlugin,
      ExportSchemaPlugin
    ],
    dynamicJson: true,
    graphileBuildOptions: {
      // https://github.com/graphile-contrib/postgraphile-plugin-connection-filter#performance-and-security
      connectionFilterComputedColumns: false,
      connectionFilterSetofFunctions: false,
      connectionFilterLists: false,
      // connectionFilterRelations: true,
    },
    watchPg: true,
    disableQueryLog: process.env.NODE_ENV !== 'development',
    // pgDefaultRole:
    //   process.env.NODE_ENV === 'development' ? 'graphql' : 'viewer',
  })
}
