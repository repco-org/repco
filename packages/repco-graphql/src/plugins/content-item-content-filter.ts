import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemContentFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'searchContent',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
  }),
  (value, helpers, build) => {
    if (value == null) return
    const { sql, sqlTableAlias } = helpers
    return sql.raw(
      `LOWER(summary::text) LIKE LOWER('%${value}%') OR LOWER(content::text) LIKE LOWER('%${value}%')`,
    )
  },
)

export default ContentItemContentFilterPlugin
