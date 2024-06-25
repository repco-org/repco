import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const RevisionsByEntityUrisNot = makeAddPgTableConditionPlugin(
  'public',
  'Revision',
  'byEntityUrisNot',
  (build) => ({
    description:
      'Filters the list to Revisions that are not in the list of uris.',
    type: build.graphql.GraphQLString,
  }),
  (value: any, helpers, build) => {
    if (value == null) return
    const { sql, sqlTableAlias } = helpers
    var inValues = value.split(',')
    return sql.raw(`"entityUris" NOT IN ('{${inValues.join(`}','{`)}}')`)
  },
)

export default RevisionsByEntityUrisNot
