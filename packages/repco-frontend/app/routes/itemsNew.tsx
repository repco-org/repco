import React, { useState } from 'react'
import { LoaderFunction } from '@remix-run/node'
import { gql, useQuery } from 'urql'
import {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types'
import { parsePagination } from '~/lib/graphql.server'

const limit = 10
const query = 'graphql'

const QUERY = gql`
  query LoadContentItems(
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
  const pagination = parsePagination(url)

  const [result, reexecuteQuery] = useQuery<
    LoadContentItemsQuery,
    LoadContentItemsQueryVariables
  >({
    query: QUERY,
  })

  console.log(result)
  return null
}

const itemsNew = () => {
  const [after, setAfter] = useState('')

  const [result] = useQuery({
    query: QUERY,
    variables: { query, first: limit, after },
  })

  const { data, fetching, error } = result

  const searchResults = data?.search
  console.log('RESULT', searchResults)

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}

      {fetching && <p>Loading...</p>}

      {searchResults && (
        <>
          {searchResults.edges.map(({ node }: any) => (
            <div key={node.id}>
              {node.id}: {node.name}
            </div>
          ))}

          {searchResults.pageInfo.hasNextPage && (
            <button onClick={() => setAfter(searchResults.pageInfo.endCursor)}>
              load more
            </button>
          )}
        </>
      )}
    </div>
  )
}

export default itemsNew
