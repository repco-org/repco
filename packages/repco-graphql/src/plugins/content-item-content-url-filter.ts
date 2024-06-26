import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemContentUrlFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'searchContentUrl',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in contentUrl.',
    type: build.graphql.GraphQLString,
  }),
  (value, helpers, build) => {
    if (value == null) return
    const { sql, sqlTableAlias } = helpers
    return sql.raw(`LOWER("contentUrl"::text) LIKE LOWER('%${value}%')`)
  },
)

export default ContentItemContentUrlFilterPlugin
