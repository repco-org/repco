import fetch from 'sync-fetch'
import { makeAddPgTableConditionPlugin } from 'graphile-utils'

const ContentItemFilterPlugin = makeAddPgTableConditionPlugin(
  'public',
  'ContentItem',
  'search',
  (build) => ({
    description:
      'Filters the list to ContentItems that have a specific keyword.',
    type: build.graphql.GraphQLString,
    defaultValue: '',
  }),
  (value, helpers, build) => {
    const { sql, sqlTableAlias } = helpers

    var data = {
      query: {
        query_string: {
          query: value,
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

    return sql.raw(
      `uid IN (${json.hits.hits
        .map((entry: any) => `'${entry['_id']}'`)
        .join(',')})`,
    )
  },
)

export default ContentItemFilterPlugin
