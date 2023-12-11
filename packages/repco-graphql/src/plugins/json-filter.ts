import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const JsonFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'searchTitle',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    return sql.raw(`title::text LIKE '%${value}%'`)
  },
)

export default JsonFilterPlugin
