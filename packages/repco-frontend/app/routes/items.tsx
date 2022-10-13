import type { LoaderFunction } from '@remix-run/node'
import {
  Link,
  useFetcher,
  useLoaderData,
  useSearchParams,
} from '@remix-run/react'
import { gql } from '@urql/core'
import { useCallback, useEffect, useState } from 'react'
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
    //TODO: fix type-error
    { first: 10, after: cursor, orderBy: order },
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()

  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }
  if (!data.contentItems.pageInfo) {
    return 'Whats going on?'
  }

  const [pageInfo, setPageInfo] = useState(data.contentItems.pageInfo)
  const [nodes, setNodes] = useState(data.contentItems.nodes)
  const [searchParams, setSearchParams] = useSearchParams()

  const [page, setPage] = useState<string | null>()
  const [order, setOrder] = useState('')
  const [shouldFetchOrder, setShouldFetchOrder] = useState(false)

  const [shouldFetch, setShouldFetch] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [height, setHeight] = useState(null)

  const fetcher = useFetcher()

  // Set the height of the parent container
  const divHeight = useCallback(
    (node: any) => {
      if (node !== null) {
        setHeight(node.getBoundingClientRect().height)
      }
    },
    [nodes.length],
  )

  // Add Listeners to scroll and client resize
  useEffect(() => {
    const scrollListener = () => {
      setClientHeight(window.innerHeight)
      setScrollPosition(window.scrollY)
    }

    // Avoid running during SSR
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', scrollListener)
    }

    // Clean up
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', scrollListener)
      }
    }
  }, [])

  useEffect(() => {
    setSearchParams({
      page: page || '',
      order: order,
    })
    setShouldFetch(true)
  }, [order, page])
  //fetch if order changes
  useEffect(() => {
    fetcher.load(`/items?order=${order}`)
  }, [shouldFetchOrder])
  // loads next page
  useEffect(() => {
    if (!shouldFetch || !height) return
    if (clientHeight + scrollPosition < height) return
    if (!pageInfo.hasNextPage) return
    setOrder(order)
    setPage(pageInfo.endCursor)
    fetcher.load(`/items?page=${page}&order=${order}`)
    console.log(fetcher)
    setShouldFetch(false)
  }, [searchParams, clientHeight, scrollPosition, fetcher])
  //merge data
  useEffect(() => {
    console.log('FETCHER', fetcher.data)
    if (fetcher.data && fetcher.data.length === 0) {
      setShouldFetch(false)
      return
    }

    if (fetcher.data) {
      if (!fetcher.data.data.contentItems) return
      setPageInfo(fetcher.data.data.contentItems.pageInfo)
      if (shouldFetchOrder) {
        setNodes(fetcher.data.data.contentItems.nodes)
        setShouldFetchOrder(false)
      } else {
        setNodes((prevNodes: any) => [
          ...prevNodes,
          ...fetcher.data.data.contentItems.nodes,
        ])
      }

      setShouldFetch(true)
    }
  }, [fetcher.data])

  return (
    <main>
      <button
        onClick={() => {
          setOrder('TITLE_DESC'), setShouldFetchOrder(true)
        }}
      >
        OrderBy
      </button>
      <button
        onClick={() => {
          setOrder(order), setPage(pageInfo.endCursor)
        }}
      >
        both
      </button>
      <div ref={divHeight}>
        <ul>
          {nodes.map((node, i) => (
            <li key={i}>
              <h2>
                <Link to={`/item/${node.uid}`}>{node.title}</Link>
              </h2>
              <SanitizedHTML allowedTags={['a', 'p']} html={node.summary} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
