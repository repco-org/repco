/*
 * Infinite Scroll using Remix Run
 * Based on client-side Scroll position
 * Full Article here: https://dev.to/ptenteromano/infinite-scroll-with-remix-run-1g7
 */
import stylesUrl from '~/styles/index.css'
import type { LinksFunction } from '@remix-run/node'
import { json, LoaderFunction } from '@remix-run/node'
import { Link, Outlet, useFetcher, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useState } from 'react'
import { gql } from 'urql'
import { SanitizedHTML } from '~/components/sanitized-html'
import { graphqlQuery } from '~/lib/graphql.server'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }]
}
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
  const courser = getPage(new URL(request.url).searchParams)
  const data = await graphqlQuery(QUERY, {
    first: 10,
    last: null,
    after: courser.after,
    before: null,
  })
  return json(data)
}

export default function Items() {
  const { data } = useLoaderData()
  const [pageInfo, setPageInfo] = useState(data.contentItems.pageInfo)
  const [nodes, setNodes] = useState(data.contentItems.nodes)
  const fetcher = useFetcher()
  const [showAddModal, setShowAddModal] = useState(false)

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

  // Listen on scrolls. Fire on some self-described breakpoint
  useEffect(() => {
    if (!shouldFetch || !height) return
    if (clientHeight + scrollPosition < height) return
    fetcher.load(`/items?page=${pageInfo.endCursor}`)
    setShouldFetch(false)
  }, [clientHeight, scrollPosition, fetcher])

  // Merge nodes, increment page, and allow fetching again
  useEffect(() => {
    // Discontinue API calls if the last page has been reached
    if (fetcher.data && fetcher.data.length === 0) {
      setShouldFetch(false)
      return
    }

    // Nodes contain data, merge them and allow the possiblity of another fetch
    if (fetcher.data) {
      console.log(fetcher.data)
      setNodes((prevNodes: any) => [
        ...prevNodes,
        ...fetcher.data.data.contentItems.nodes,
      ])
      setPageInfo(fetcher.data.data.contentItems.pageInfo)
      setPage(pageInfo.endCursor)
      if (pageInfo.hasNextPage) {
        setShouldFetch(true)
      }
    }
  }, [fetcher.data])
  return (
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
                //onClick={() => {window.open(`/item/${node.uid}`)}}
              >
                <td>{index + 1}</td>
                <td>
                  <Link to={`/items/item/${node.uid}`}>{node.uid}</Link>
                </td>
                <td>{node.title}</td>
                <td>
                  <SanitizedHTML allowedTags={['a', 'p']} html={node.summary} />
                </td>
              </tr>
            )
          })}
        </table>
      </div>
      <div className="flex-item">
        <Outlet></Outlet>
      </div>
    </div>
  )
}
