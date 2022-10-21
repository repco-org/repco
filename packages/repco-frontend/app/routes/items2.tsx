import type { LoaderFunction } from '@remix-run/node'
import { Link, useFetcher, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { Pager } from '~/components/pager'
import type {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types.js'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'
import { useEffect, useState } from 'react'

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
  const pagination = parsePagination(url)
  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    pagination,
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()
  console.log(data)
  const [includes, setIncludes] = useState('')
  const [initFetch, setInitFetch] = useState(false)
  //May there is a better way to do - with out this the search bugs
  const [searchField, setSearchField] = useState('')
  const [shouldFetch, setShouldFetch] = useState(true)
const fetcher = useFetcher()
  function includesSearch() {
    setShouldFetch(true)
    setIncludes(searchField)
   
  }

  useEffect(()=> {
    if (shouldFetch) {
      fetcher.load(
        `/items?page=${data.contentItems?.pageInfo?.endCursor}&orderBy=&includes=${includes}`,
      )
      setShouldFetch(false)
      return
    }

  }, [data.contentItems?.pageInfo?.endCursor, fetcher, includes, shouldFetch])
  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }
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
          onClick={() => includesSearch()}
        >
          Search
        </button>
      </div>
       
      <Pager url="/items" pageInfo={data.contentItems.pageInfo} />
      {data.contentItems.nodes.map((node, i) => (
        <li key={i}>
          <h2>
            <Link to={`/item/${node.uid}`}>{node.title}</Link>
          </h2>
          {/* <SanitizedHTML allowedTags={['a', 'p']} html={node.summary} /> */}
        </li>
      ))}
    </main>
  )
}
