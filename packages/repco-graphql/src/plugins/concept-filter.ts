import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ConceptFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'Concept',
  'containsName',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword in title.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value, helpers, build) => {
    const { sql, sqlTableAlias } = helpers
    return sql.raw(`LOWER(name::text) LIKE LOWER('%${value}%')`)
  },
)

export default ConceptFilterPlugin
