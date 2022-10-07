import { json, LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { gql } from 'urql'
import { graphqlQuery } from '~/lib/graphql.server'
import { RemixPagination } from '~/lib/remix-pagination'

const QUERY = gql`
  query LoadContentItemsByOffset($offset: Int) {
    contentItems(offset: $offset) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      nodes {
        title
        uid
        summary
      }
    }
  }
`

const getPage = (searchParams: URLSearchParams) => ({
  after: searchParams.get('page'),
})

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const offset = (parseInt(url.searchParams.get('page') || '1') - 1) * 10
  const { data } = await graphqlQuery(QUERY, {
    offset: offset,
  })
  return json({
    nodes: data.contentItems.nodes,
    count: data.contentItems.totalCount,
  })
}

export default function () {
  const { nodes, count } = useLoaderData<typeof loader>()
  console.log(nodes)
  return (
    <div>
      <div>
        {nodes?.map((p: any) => (
          <div key={p?.uid} data-contentItem-id={p?.uid}>
            <h1>{p?.title}</h1>
          </div>
        ))}
      </div>

      <div>
        <RemixPagination total={count || 0} size={10} />
      </div>
    </div>
  )
}
