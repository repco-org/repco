import { gql, makeExtendSchemaPlugin } from 'graphile-utils'

const ElasticTest = makeExtendSchemaPlugin((build) => {
  const { pgSql: sql } = build

  return {
    typeDefs: gql`
      extend type Query {
        searchContentItems(searchText: String!): [ContentItem!]
      }
    `,
    resolvers: {
      Query: {
        searchContentItems: async (_query, args, context, resovleInfo) => {
          const rows = await resovleInfo.graphile.selectGraphQLResultFromTable(
            sql.fragment`ContentItem`,
            (tableAlias, queryBuilder) => {
              queryBuilder.orderBy(sql.fragment`x.ordering`)
            },
          )
        },
      },
    },
  }
})
export default ElasticTest
