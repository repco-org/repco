import { json, LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { gql } from 'urql'
import { graphqlQuery } from '~/lib/graphql.server'

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

interface parseNumberParams {
  value: string | null
  defaultValue: number
}
const parseNumber = ({ value, defaultValue }: parseNumberParams) => {
  return typeof value === 'string' ? parseInt(value) : defaultValue
}

export const loader: LoaderFunction = async ({ request }) => {
  console.log('PAGINATED')
  const url = new URL(request.url)
  const offset = (parseInt(url.searchParams.get('page') || '1') - 1) * 10
  const take = parseInt(url.searchParams.get('take') || '2')

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

export default function Ip() {
  const { nodes, count } = useLoaderData<typeof loader>()

  return nodes.map((e) => <div>{e.uid}</div>)
}
