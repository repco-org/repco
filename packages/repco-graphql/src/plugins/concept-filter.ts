import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ConceptFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'filterName',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    return sql.raw(`LOWER(title::text) LIKE LOWER('%${value}%')`)
  },
)

export default ConceptFilterPlugin
