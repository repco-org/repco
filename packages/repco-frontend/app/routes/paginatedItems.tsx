import { json, LoaderFunction } from '@remix-run/node'
import { Form, useLoaderData, useSearchParams } from '@remix-run/react'
import { gql } from 'urql'
import { Pagination, usePagination } from '../components/utils/pagination'
import { graphqlQuery } from '../lib/graphql.server'

interface parseNumberParams {
  value: string | null
  defaultValue: number
}
const parseNumber = ({ value, defaultValue }: parseNumberParams) => {
  return typeof value === 'string' ? parseInt(value) : defaultValue
}
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
const getOrderBy = (searchParams: URLSearchParams) => ({
  orderBy: searchParams.get('orderBy'),
})
export const loader: LoaderFunction = async ({ request }) => {
  console.log('PAGINATED')
  const url = new URL(request.url)
  const offset = (parseInt(url.searchParams.get('page') || '1') - 1) * 10
  const take = parseInt(url.searchParams.get('take') || '10')

  const skip = (offset - 1) * take
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

export default function paginatedItems() {
  const { nodes, count } = useLoaderData<typeof loader>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { page, setPage, take, setTake, numberOfPages } = usePagination({
    count,
  })

  return (
    <div>
      <Form>
        <input
          type="text"
          name="includes"
          placeholder="Search tweets..."
          defaultValue={searchParams.get('includes') || ''}
        />
        <button type="submit">Search</button>
      </Form>

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
