import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { gql } from 'urql'
import {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

const QUERY = gql`
  query LoadContentItems1(
    $first: Int
    $last: Int
    $after: Cursor
    $before: Cursor
  ) {
    contentItems(first: $first, last: $last, after: $after, before: $before) {
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

const limit = 5
const query = 'graphql'
type LoaderData = { content: any }

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const pagination = parsePagination(url)
  const data: LoaderData = {
    content: await graphqlQuery<
      LoadContentItemsQuery,
      LoadContentItemsQueryVariables
    >(QUERY, pagination),
  }

  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=120',
    },
  })
}

export default function Infinite() {
  const result = useLoaderData()

  const [after, setAfter] = useState('')
  const [start, setStart] = useState('')
  const [items, setItems] = useState(result.content.data.contentItems.nodes)
  const fetcher = useFetcher()

  let searchResults = result.content.data.contentItems

  useEffect(() => {
    if (after !== '') {
      fetcher.load(`/infinite?after=${after}`)
      setAfter('')
      searchResults = fetcher.data?.content.data.contentItems
    }
  })

  useEffect(() => {
    if (fetcher.data) {
      setItems((prevItems: any) => [
        ...prevItems,
        ...fetcher.data?.content.data.contentItems.nodes,
      ])
    }
  }, [fetcher.data])

  return (
    <div>
      {items && (
        <>
          {items.map((node: any) => (
            <div key={node.uid}>
              {node.uid}: {node.title}
            </div>
          ))}
        </>
      )}
      {searchResults.pageInfo.hasNextPage && (
        <button onClick={() => setAfter(searchResults.pageInfo.endCursor)}>
          load more
        </button>
      )}
    </div>
  )
}
