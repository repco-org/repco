import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemContentFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'searchContent',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    return sql.raw(
      `LOWER(summary::text) LIKE LOWER('%${value}%') OR LOWER(content::text) LIKE LOWER('%${value}%')`,
    )
  },
)

export default ContentItemContentFilterPlugin
