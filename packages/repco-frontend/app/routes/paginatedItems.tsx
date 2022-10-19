import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { gql } from 'urql'
import { Pagination, usePagination } from '../components/utils/pagination'
import { graphqlQuery } from '../lib/graphql.server'

const QUERY = gql`
  query LoadContentItemsByOffset(
    $offset: Int
    $first: Int
    $orderBy: [ContentItemsOrderBy!]
    $includes: String
  ) {
    contentItems(
      offset: $offset
      first: $first
      orderBy: $orderBy
      filter: { title: { includes: $includes } }
    ) {
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
export const loader: LoaderFunction = async ({ request }) => {
  console.log('PAGINATED')
  const url = new URL(request.url)
  const offset = (parseInt(url.searchParams.get('page') || '1') - 1) * 10
  const take = parseInt(url.searchParams.get('take') || '10')

  const orderBy = url.searchParams.get('order') || 'TITLE_ASC'
  const includes = url.searchParams.get('includes') || ''

  const { data } = await graphqlQuery(QUERY, {
    offset: offset,
    first: take,
    orderBy: orderBy,
    includes: includes,
  })
  return json({
    nodes: data.contentItems.nodes,
    count: data.contentItems.totalCount,
  })
}

export default function PaginatedItems() {
  const { nodes, count } = useLoaderData<typeof loader>()
  const { page, setPage, take, setTake, numberOfPages } = usePagination({
    count,
  })

  return (
    <div>
      <div>
        {nodes?.map((p: any, index: number) => (
          <div key={p?.uid} data-contentItem-id={p?.uid}>
            <h1>{p?.title}</h1>
          </div>
        ))}
      </div>

      <div>
        <Pagination
          numberOfPages={numberOfPages}
          take={take}
          page={page}
          setPage={setPage}
          setTake={setTake}
        />
      </div>
    </div>
  )
}
