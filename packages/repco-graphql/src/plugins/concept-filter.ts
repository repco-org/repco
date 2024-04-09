import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ConceptFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'Concept',
  'containsName',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
  }),
  (value, helpers, build) => {
    if (value == null) return
    const { sql, sqlTableAlias } = helpers
    return sql.raw(`LOWER(name::text) LIKE LOWER('%${value}%')`)
  },
)

export default ConceptFilterPlugin
