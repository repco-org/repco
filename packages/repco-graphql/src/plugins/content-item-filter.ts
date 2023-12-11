import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'search',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    return sql.raw(
      `LOWER(title::text) LIKE LOWER('%${value}%') OR LOWER(summary::text) LIKE LOWER('%${value}%') OR LOWER(content::text) LIKE LOWER('%${value}%')`,
    )
  },
)

export default ContentItemFilterPlugin
