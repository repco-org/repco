import { makeAddPgTableConditionPlugin } from 'graphile-utils'
import { GraphQLNonNull, GraphQLString } from 'graphql'

const CustomFilterPlugin = makeAddPgTableConditionPlugin(
  'repco',
  'Revision',
  'language',
  (build) => ({
    description: 'Filters the list to Revisions that have a specific language.',
    type: new build.graphql.GraphQLList(
      new GraphQLNonNull(GraphQLString) as any,
    ),
  }),
  (value, helpers, build) => {
    if (value == null) return
    const { sql, sqlTableAlias } = helpers
    return sql.fragment`${sqlTableAlias}->>'en' LIKE '%${sql.value(value)}%'`
  },
)

export default CustomFilterPlugin
