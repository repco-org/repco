import fetch from 'sync-fetch'
import { makeAddPgTableConditionPlugin } from 'graphile-utils'
import { log } from 'repco-common'

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
      size: 10000,
      query: {
        query_string: {
          query: value,
        },
      },
      fields: [],
      _source: false,
    }

    var url = 'http://es01:9200/_search' // for local dev work use 'http://localhost:9201/_search' since this will not be started in docker container
    const response = fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      log.warn(response.statusText)
      var query: string = value as string
      return sql.raw(`uid = '${query}'`)
    } else {
      var json = response.json()
      var values = []

      if (json.hits.hits.length > 0) {
        for (let i = 0; i < json.hits.hits.length; i++) {
          const element = json.hits.hits[i]
          values.push(`('${element['_id']}',${element['_score']})`)
        }

        log.debug('es values found: ', values.length)
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
      } else {
        var query: string = value as string
        return sql.raw(`uid = '${query}'`)
      }
    }
  },
)

export default ContentItemFilterPlugin
