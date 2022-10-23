import type { LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
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
    $last: Int
    $after: Cursor
    $before: Cursor
    $orderBy: [ContentItemsOrderBy!]
    $includes: String
  ) {
    contentItems(
      first: $first
      last: $last
      after: $after
      before: $before
      orderBy: $orderBy
      filter: { title: { includes: $includes } }
    ) {
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

  const after = url.searchParams.get('after')
  const before = url.searchParams.get('before')
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_ASC'
  const includes = url.searchParams.get('includes') || ''
  if (after && before) throw new Error('Invalid query arguments.')
  const last = before ? 10 : null
  const first = last ? null : 10

  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    {
      first: first,
      last: last,
      after: after,
      before: before,
      orderBy: orderBy,
      includes: includes,
    },
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()

  const [pageInfo, setPageInfo] = useState(data.contentItems?.pageInfo)
  const [nodes, setNodes] = useState(data.contentItems?.nodes)

  const [orderBy, setOrderBy] = useState('')
  const [includes, setIncludes] = useState('')
  const [before, setBefore] = useState(false)
  const [after, setAfter] = useState(false)

  const [searchField, setSearchField] = useState('')

  const [shouldFetch, setShouldFetch] = useState(false)
  const fetcher = useFetcher()

  useEffect(() => {
    if (shouldFetch) {
      if (after) {
        fetcher.load(
          `/items2?after=${pageInfo?.endCursor}&orderBy=${orderBy}&includes=${includes}`,
        )
        setShouldFetch(false)
        setAfter(false)
        return
      }

      if (before) {
        fetcher.load(
          `/items2?before=${pageInfo?.startCursor}&orderBy=${orderBy}&includes=${includes}`,
        )
        setShouldFetch(false)
        setBefore(false)
        return
      }

      fetcher.load(`/items2?orderBy=${orderBy}&includes=${includes}`)

      setShouldFetch(false)
      return
    }
  }, [after, before, fetcher, includes, orderBy, pageInfo, shouldFetch])

  useEffect(() => {
    if (fetcher.data) {
      console.log('FETCH', fetcher.data.data.contentItems.nodes)
      setNodes(fetcher.data.data.contentItems.nodes)
      setPageInfo(fetcher.data.data.contentItems.pageInfo)
      console.log(pageInfo)
    }
  }, [fetcher.data, pageInfo])

  return (
    <main>
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
          onClick={() => {
            setShouldFetch(true)
            setIncludes(searchField)
          }}
        >
          Search
        </button>
      </div>
      <div>
        <label className="sr-only">Order By</label>
        <select
          id="orderBy"
          className="block py-2.5 px-0 w-full text-sm text-gray-500 bg-transparent border-0 border-b-2 border-gray-200 appearance-none dark:text-gray-400 dark:border-gray-700 focus:outline-none focus:ring-0 focus:border-gray-200 peer"
          defaultValue="TITLE_ASC"
          onChange={(e) => {
            setShouldFetch(true)
            setOrderBy(e.target.value)
          }}
        >
          <option value="TITLE_ASC">Title ASC</option>
          <option value="TITLE_DESC">Title DESC</option>
        </select>{' '}
      </div>
      {nodes &&
        nodes.map((node, i) => (
          <div
            key={node.uid}
            className="p-4 w-full text-center bg-white rounded-lg border shadow-md sm:p-8 dark:bg-gray-800 dark:border-gray-700"
          >
            <div className="flex justify-end px-4 pt-4">
              <button
                id="dropdownDefault"
                data-dropdown-toggle="dropdown"
                className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2.5 text-center inline-flex items-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                type="button"
              >
                Dropdown button{' '}
                <svg
                  className="ml-2 w-4 h-4"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>
              {/* <!-- Dropdown menu --> */}
              <div
                id="dropdown"
                className="hidden z-10 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700"
              >
                <ul
                  className="py-1 text-sm text-gray-700 dark:text-gray-200"
                  aria-labelledby="dropdownDefault"
                >
                  <li>
                    <a
                      href="#"
                      className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Settings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Earnings
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
                    >
                      Sign out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
            <h5 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">
              <SanitizedHTML allowedTags={['a', 'p']} html={node.title} />
            </h5>
            <p className="mb-5 text-base text-gray-500 sm:text-lg dark:text-gray-400">
              <i>{node.uid}</i>
            </p>
            <p className="mb-5 text-base text-gray-500 sm:text-lg dark:text-gray-400">
              <SanitizedHTML allowedTags={['a', 'p']} html={node.summary} />
            </p>
            <div className="justify-center items-center space-y-4 sm:flex sm:space-y-0 sm:space-x-4">
              <a
                href="/"
                className="w-full sm:w-auto text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              >
                <div className="items-center">
                  <div className="-mt-1 font-sans text-sm font-semibold">
                    add to Playlist{' '}
                  </div>
                </div>
              </a>
            </div>
          </div>
        ))}
      <div>
        <div className="flex flex-row mx-auto">
          {pageInfo?.hasPreviousPage && (
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={() => {
                setShouldFetch(true)
                setBefore(true)
              }}
            >
              <div className="flex flex-row align-middle">
                <svg
                  className="w-5 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
                <p className="ml-2">Prev</p>
              </div>
            </button>
          )}
          {pageInfo?.hasNextPage && (
            <button
              type="button"
              className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center mr-1 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={() => {
                setShouldFetch(true)
                setAfter(true)
              }}
            >
              <div className="flex flex-row align-middle">
                <span className="mr-2">Next</span>
                <svg
                  className="w-5 ml-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              </div>
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
