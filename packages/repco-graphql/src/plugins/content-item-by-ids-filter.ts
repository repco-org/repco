import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemByIdsFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'byIds',
  (build) => ({
    description:
      'Filters the list to ContentItems that are in the list of ids.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value: any, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    var inValues = value.split(',')
    return sql.raw(`uid IN ('${inValues.join(`','`)}')`)
  },
)

export default ContentItemByIdsFilterPlugin
