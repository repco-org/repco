import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemByUidsFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'byUids',
  (build) => ({
    description:
      'Filters the list to ContentItems that are in the list of uids.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value: any, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    var inValues = value.split(',')
    return sql.raw(`uid IN ('${inValues.join(`','`)}')`)
  },
)

export default ContentItemByUidsFilterPlugin
