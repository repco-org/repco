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
    var values = []
    for (let i = 0; i < json.hits.hits.length; i++) {
      const element = json.hits.hits[i]
      values.push(`('${element['_id']}',${element['_score']})`)
    }

    console.log(values)
    var temp = `JOIN (VALUES ${values.join(
      ',',
    )}) as x (id, ordering) on uid = x.id`

    const customQueryBuilder = helpers.queryBuilder as any
    customQueryBuilder['join'] = function (expr: any): void {
      this.checkLock('join')
      this.data.join.push(expr)
    }
    customQueryBuilder.join(sql.raw(temp))

    helpers.queryBuilder.orderBy(sql.fragment`x.ordering`, false)

    return sql.raw(
      `uid IN (${json.hits.hits
        .map((entry: any) => `'${entry['_id']}'`)
        .join(',')})`,
    )
  },
)

export default ContentItemFilterPlugin
