//TODO: fix typing, add some more Content, style for mobile,
//improve filters and search, improve infinite scroll or us more efficient pagination
//add modal rout for details for better ux, use cache for queries
import type { LoaderFunction } from '@remix-run/node'
import { Form, NavLink, useFetcher, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { useCallback, useEffect, useState } from 'react'
import {
  TiArrowSortedDown,
  TiArrowSortedUp,
  TiArrowUnsorted,
} from 'react-icons/ti'
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

  const [pageInfo, setPageInfo] = useState(data.contentItems?.pageInfo)
  const [nodes, setNodes] = useState(data.contentItems?.nodes)

  const [orderBy, setOrderBy] = useState('')
  const [includes, setIncludes] = useState('')
  const [initFetch, setInitFetch] = useState(false)
  //May there is a better way to do - with out this the search bugs
  const [searchField, setSearchField] = useState('')

  const [scrollPosition, setScrollPosition] = useState(0)
  const [clientHeight, setClientHeight] = useState(0)
  const [height, setHeight] = useState(null)

  const [shouldFetch, setShouldFetch] = useState(true)
  const divHeight = useCallback((node: any) => {
    if (node !== null) {
      setHeight(node.getBoundingClientRect().height)
    }
  }, [])

  const fetcher = useFetcher()

  //Following functions handle the click events for the buttons
  function orderByAscDesc(asc: string, desc: string) {
    setOrderBy('')
    setShouldFetch(true)
    orderBy.includes(asc) ? setOrderBy(desc) : setOrderBy(asc)
    setInitFetch(true)
  }

  function includesSearch() {
    setShouldFetch(true)
    setIncludes(searchField)
    setInitFetch(true)
  }

  // Set the height of the parent container whenever a container are loaded

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

  // Merge nodes, increment page, and allow fetching again
  useEffect(() => {
    // Discontinue API calls if the last page has been reached

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

      if (
        pageInfo?.hasNextPage ||
        fetcher.data.data.contentItems.pageInfo.hasNextPage
      ) {
        setShouldFetch(true)
      }
    }
  }, [fetcher.data, initFetch, pageInfo?.hasNextPage])

  // Listen on scrolls. Fire on some self-described breakpoint
  useEffect(() => {
    if (shouldFetch && initFetch) {
      fetcher.load(`/items?page=&orderBy=${orderBy}&includes=${includes}`)
      setShouldFetch(false)
      return
    }

    if (!shouldFetch || !height) return
    if (clientHeight + scrollPosition < height) return

    if (shouldFetch) {
      fetcher.load(
        `/items?page=${pageInfo?.endCursor}&orderBy=${orderBy}&includes=${includes}`,
      )
      setShouldFetch(false)
      return
    }

    fetcher.load(`/items?page=${pageInfo?.endCursor}`)
    setShouldFetch(false)
  }, [
    clientHeight,
    scrollPosition,
    fetcher,
    orderBy,
    includes,
    shouldFetch,
    initFetch,
    height,
    pageInfo?.endCursor,
  ])
  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }

  return (
    <div>
      <div className="relative">
        <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
          <svg
            aria-hidden="true"
            className="w-5 h-5 text-gray-500 dark:text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
        </div>
        <input
          type="search"
          id="default-search"
          className="block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          placeholder="Search Titles..."
          onChange={(e) => setSearchField(e.target.value)}
        />
        <button
          className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          onClick={() => includesSearch()}
        >
          Search
        </button>
      </div>
      <div className="flex flex-col" ref={divHeight}>
        <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="py-2 inline-block min-w-full sm:px-6 lg:px-8">
            <div className="overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-white border-b">
                  <tr>
                    <th
                      scope="col"
                      className="text-sm font-medium text-gray-900 px-6 py-4 text-left"
                    >
                      Nr
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer text-sm font-medium text-gray-900 px-6 py-4 text-left"
                      onClick={() => orderByAscDesc('UID_ASC', 'UID_DESC')}
                    >
                      {
                        <div className="flex items-stretch">
                          UID
                          {!orderBy.includes('UID') ? (
                            <TiArrowUnsorted />
                          ) : orderBy.includes('ASC') ? (
                            <TiArrowSortedUp />
                          ) : (
                            <TiArrowSortedDown />
                          )}
                        </div>
                      }
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer text-sm font-medium text-gray-900 px-6 py-4 text-left"
                      onClick={() => orderByAscDesc('TITLE_ASC', 'TITLE_DESC')}
                    >
                      {
                        <div className="flex items-stretch">
                          Title
                          {!orderBy.includes('TITLE') ? (
                            <TiArrowUnsorted />
                          ) : orderBy.includes('ASC') ? (
                            <TiArrowSortedUp />
                          ) : (
                            <TiArrowSortedDown />
                          )}
                        </div>
                      }
                    </th>
                    <th
                      scope="col"
                      className="cursor-pointer text-sm font-medium text-gray-900 px-6 py-4 text-left"
                      onClick={() =>
                        orderByAscDesc('SUMMARY_ASC', 'SUMMARY_DESC')
                      }
                    >
                      {
                        <div className="flex items-stretch">
                          SUMMARY
                          {!orderBy.includes('SUMMARY') ? (
                            <TiArrowUnsorted />
                          ) : orderBy.includes('ASC') ? (
                            <TiArrowSortedUp />
                          ) : (
                            <TiArrowSortedDown />
                          )}
                        </div>
                      }
                    </th>
                    <th
                      scope="col"
                      className=" text-sm font-medium text-gray-900 px-6 py-4 text-left"
                    >
                      add to Playlist
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {nodes &&
                    nodes.map((node: any, index: any) => {
                      return (
                        <tr
                          className="bg-white border-b transition duration-300 ease-in-out hover:bg-gray-100"
                          key={node.uid}
                          //TODO: my a better UX
                          // onClick={() => {
                          //   window.open(`/items/item/${node.uid}`, '_self')
                          // }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="py-4 px-6">
                            <NavLink
                              data-bs-toggle="tooltip"
                              title={node.uid}
                              data-bs-placement="top"
                              className=" text-sm px-0 py-4 font-light text-blue-600 dark:text-blue-500 hover:underline"
                              prefetch="render"
                              to={`/items/item/${node.uid}`}
                            >
                              {node.uid.substring(0, 20)}...
                            </NavLink>
                          </td>
                          <td className="text-sm whitespace-nowrap text-gray-900 font-medium px-6 py-4 ">
                            {node.title.substring(0, 100)}...
                          </td>
                          <td className="text-sm text-gray-900 font-light px-6 py-4 ">
                            <SanitizedHTML
                              allowedTags={['a', 'p']}
                              html={node.summary}
                            />
                          </td>
                          <td className="text-sm whitespace-nowrap text-gray-900 font-medium px-6 py-4 ">
                            <Form method="post" action="/playlists/add">
                              <button
                                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                                name="add-item"
                                value={node.uid}
                              >
                                add
                              </button>
                            </Form>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
