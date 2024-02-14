import fetch from 'sync-fetch'
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
          var data = {
            query: {
              query_string: {
                query: args.searchText,
              },
            },
            fields: ['id'],
            _source: false,
          }

          var url = 'http://localhost:9200/_search'
          const response = fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })

          var json = response.json()

          const rows = await resovleInfo.graphile.selectGraphQLResultFromTable(
            sql.fragment`"ContentItem"`,
            (tableAlias, queryBuilder) => {
              queryBuilder.where(
                sql.raw(
                  `uid IN (${json.hits.hits
                    .map((entry: any) => `'${entry['_id']}'`)
                    .join(',')})`,
                ),
              )
            },
          )
          console.log('rows: ', rows)
          return rows
        },
      },
    },
  }
})
export default ElasticTest
