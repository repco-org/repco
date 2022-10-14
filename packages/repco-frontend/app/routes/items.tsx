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
    $includes: String
  ) {
    contentItems(
      first: $first
      after: $after
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

type LoaderData = { data: LoadContentItemsQuery }

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url)
  const cursor = url.searchParams.get('page') || null
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_DESC'
  const includes = url.searchParams.get('includes') || ''
  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    //TODO: fix type-error
    { first: 10, after: cursor, orderBy: orderBy, includes: includes },
  )
}

export default function Items() {
  const { data } = useLoaderData<LoaderData>()

  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }

  const [pageInfo, setPageInfo] = useState(data.contentItems.pageInfo)
  const [nodes, setNodes] = useState(data.contentItems.nodes)

  const fetcher = useFetcher()

  const [orderBy, setOrderBy] = useState('')
  const [includes, setIncludes] = useState('')
  const [initFetch, setInitFetch] = useState(false)

  const [scrollPosition, setScrollPosition] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [height, setHeight] = useState(null)

  const [shouldFetch, setShouldFetch] = useState(true)
  const [page, setPage] = useState('')

  function orderByAscDesc(asc: string, desc: string) {
    setShouldFetch(true)
    orderBy.includes(asc) ? setOrderBy(desc) : setOrderBy(asc)
    setInitFetch(true)
  }

  function includesSearch() {
    setShouldFetch(true)
    setIncludes(includes)
    setInitFetch(true)
  }

  // Set the height of the parent container whenever a container are loaded
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
    if ((shouldFetch || shouldFetch) && initFetch) {
      setPage('')
      fetcher.load(`/items?page=&orderBy=${orderBy}&includes=${includes}`)
      setShouldFetch(false)
      return
    }

    if (!shouldFetch || !height) return
    if (clientHeight + scrollPosition < height) return

    if (shouldFetch || shouldFetch) {
      fetcher.load(
        `/items?page=${pageInfo?.endCursor}&orderBy=${orderBy}&includes=${includes}`,
      )
      setShouldFetch(false)
      return
    }

    fetcher.load(`/items?page=${pageInfo?.endCursor}`)
    setShouldFetch(false)
  }, [clientHeight, scrollPosition, fetcher, orderBy, includes])

  // Merge nodes, increment page, and allow fetching again
  useEffect(() => {
    // Discontinue API calls if the last page has been reached
    if (fetcher.data && fetcher.data.length === 0) {
      setShouldFetch(false)
      return
    }

    // Nodes contain data, merge them and allow the possiblity of another fetch
    if (fetcher.data) {
      if (initFetch) {
        setNodes(fetcher.data.data.contentItems.nodes)
        setInitFetch(false)
        setShouldFetch(true)
      } else {
        setNodes((prevNodes: any) => [
          ...prevNodes,
          ...fetcher.data.data.contentItems.nodes,
        ])
      }

      setPageInfo(fetcher.data.data.contentItems.pageInfo)
      setPage(pageInfo?.endCursor || '')

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
        <button onClick={() => orderByAscDesc('TITLE_ASC', 'TITLE_DESC')}>
          OrderBy
        </button>
        <input
          type="text"
          name="search"
          placeholder="search"
          onChange={(e) => setIncludes(e.target.value)}
        />
        <button onClick={() => includesSearch()}>Includes</button>
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
            {nodes &&
              nodes.map((node: any, index: any) => {
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
