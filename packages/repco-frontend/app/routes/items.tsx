import type { LoaderFunction } from '@remix-run/node'
import {
  Link,
  NavLink,
  Outlet,
  useFetcher,
  useLoaderData,
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
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_DESC'
  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    //TODO: fix type-error
    { first: 10, after: cursor, orderBy: orderBy },
  )
}

export default function Items() {
  const { data } = useLoaderData<LoaderData>()
  const [pageInfo, setPageInfo] = useState(data.contentItems?.pageInfo)
  const [nodes, setNodes] = useState(data.contentItems?.nodes)
  const fetcher = useFetcher()

  const [orderBy, setOrderBy] = useState('')
  const [shouldfetchOrderBy, setShouldFetchOrderBy] = useState(false)
  const [initFetch, setInitFetch] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [height, setHeight] = useState(null)

  const [shouldFetch, setShouldFetch] = useState(true)
  const [page, setPage] = useState('')

  // Set the height of the parent container whenever photos are loaded
  const divHeight = useCallback(
    (node: any) => {
      if (node !== null) {
        setHeight(node.getBoundingClientRect().height)
      }
    },
    [nodes?.length],
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

  // Listen on scrolls. Fire on some self-described breakpoint
  useEffect(() => {
    if (shouldfetchOrderBy && initFetch) {
      setPage('')
      fetcher.load(`/items?page=&orderBy=${orderBy}`)

      setShouldFetchOrderBy(false)
    }
    if (!shouldFetch || !height) return
    if (clientHeight + scrollPosition < height) return
    if (shouldfetchOrderBy) {
      fetcher.load(`/items?page=${pageInfo?.endCursor}&orderBy=${orderBy}`)
    } else {
      fetcher.load(`/items?page=${pageInfo?.endCursor}`)
    }
    setShouldFetchOrderBy(false)

    setShouldFetch(false)
  }, [clientHeight, scrollPosition, fetcher, orderBy])

  // Merge nodes, increment page, and allow fetching again
  useEffect(() => {
    // Discontinue API calls if the last page has been reached
    if (fetcher.data && fetcher.data.length === 0) {
      setShouldFetch(false)
      setShouldFetchOrderBy(false)
      return
    }

    // Nodes contain data, merge them and allow the possiblity of another fetch
    if (fetcher.data) {
      if (initFetch) {
        setNodes(fetcher.data.data.contentItems.nodes)
        setInitFetch(false)
        setShouldFetchOrderBy(true)
      } else {
        setNodes((prevNodes: any) => [
          ...prevNodes,
          ...fetcher.data.data.contentItems.nodes,
        ])
      }

      setPageInfo(fetcher.data.data.contentItems.pageInfo)
      setPage(pageInfo?.endCursor || '')
      console.log(
        pageInfo?.hasNextPage,
        fetcher.data.data.contentItems.pageInfo.hasNextPage,
      )
      if (
        pageInfo?.hasNextPage ||
        fetcher.data.data.contentItems.pageInfo.hasNextPage
      ) {
        setShouldFetch(true)
      }
    }
  }, [fetcher.data])
  return (
    <div>
      <div>
        <Link to="/">Home</Link>
        <button
          onClick={() => {
            setShouldFetchOrderBy(true)
            if (orderBy === 'TITLE_ASC') {
              setOrderBy('TITLE_DESC')
            } else {
              setOrderBy('TITLE_ASC')
            }
            setInitFetch(true)
          }}
        >
          OrderBy
        </button>
      </div>
      <div className="container">
        <div className="fixed" ref={divHeight}>
          <table className="table">
            <tr>
              <th>Nr</th>
              <th>UID</th>
              <th>Title</th>
              <th>Summary</th>
            </tr>
            {nodes.map((node: any, index: any) => {
              return (
                <tr
                  key={node.uid}
                  //TODO: my a better UX
                  //onClick={() => {window.open(`/item/${node.uid}`)}}
                >
                  <td>{index + 1}</td>
                  <td>
                    <NavLink prefetch="render" to={`/items/item/${node.uid}`}>
                      {node.uid}
                    </NavLink>
                  </td>
                  <td>{node.title}</td>
                  <td>
                    <SanitizedHTML
                      allowedTags={['a', 'p']}
                      html={node.summary}
                    />
                  </td>
                </tr>
              )
            })}
          </table>
        </div>
        <div className="flex-item">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
