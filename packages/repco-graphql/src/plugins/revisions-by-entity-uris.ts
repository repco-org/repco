import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const RevisionsByEntityUris = makeAddPgTableConditionPlugin(
  'public',
  'Revision',
  'byEntityUris',
  (build) => ({
    description: 'Filters the list to Revisions that are in the list of uris.',
    type: build.graphql.GraphQLString,
  }),
  (value: any, helpers, build) => {
    if (value == null) return
    const { sql, sqlTableAlias } = helpers
    var inValues = value.split(',')
    return sql.raw(`entityUris IN ('{${inValues.join(`}','{`)}}')`)
  },
)

export default RevisionsByEntityUris
