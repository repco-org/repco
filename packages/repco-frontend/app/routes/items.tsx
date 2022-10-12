import type { LoaderFunction } from '@remix-run/node'
import {
  Link,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react'
import { gql } from '@urql/core'
import { useEffect, useState } from 'react'
import { SanitizedHTML } from '~/components/sanitized-html'
import type {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

const QUERY = gql`
  query LoadContentItems(
    $first: Int
    $after: Cursor
    $orderBy: [ContentItemsOrderBy!]
  ) {
    contentItems(first: $first, after: $after, orderBy: $orderBy) {
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

type LoaderData = { data: LoadContentItemsQuery }

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url)
  const cursor = url.searchParams.get('page') || null
  const order = url.searchParams.get('order') || 'TITLE_ASC'
  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    { first: 10, after: cursor, orderBy: order },
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState<string | null>()
  const [order, setOrder] = useState('')

  useEffect(() => {
    setSearchParams({
      page: page || '',
      order: order,
    })
  }, [order, page])
  const fetcher = useFetcher()

  useEffect(() => {
    fetcher.load(`/items?page=${page}&order=${order}`)
  }, [searchParams])

  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }
  if (!data.contentItems.pageInfo) {
    return 'Whats going on?'
  }

  return (
    <main>
      <button onClick={() => setOrder('TITLE_DESC')}>OrderBy</button>
      <button onClick={() => setPage(data.contentItems?.pageInfo.endCursor)}>
        {' '}
        NEXT
      </button>
      <button
        onClick={() => {
          setOrder('TITLE_ASC'), setPage(data.contentItems?.pageInfo.endCursor)
        }}
      >
        both
      </button>

      <ul>
        {data.contentItems.nodes.map((node, i) => (
          <li key={i}>
            <h2>
              <Link to={`/item/${node.uid}`}>{node.title}</Link>
            </h2>
            <SanitizedHTML allowedTags={['a', 'p']} html={node.summary} />
          </li>
        ))}
      </ul>
    </main>
  )
}
