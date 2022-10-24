import type { LoaderFunction } from '@remix-run/node'
import { Form, NavLink, useFetcher, useLoaderData } from '@remix-run/react'
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
  const last = before ? 50 : null
  const first = last ? null : 50

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
          `/items?after=${pageInfo?.endCursor}&orderBy=${orderBy}&includes=${includes}`,
        )
        setShouldFetch(false)
        setAfter(false)
        return
      }

      if (before) {
        fetcher.load(
          `/items?before=${pageInfo?.startCursor}&orderBy=${orderBy}&includes=${includes}`,
        )
        setShouldFetch(false)
        setBefore(false)
        return
      }

      fetcher.load(`/items?orderBy=${orderBy}&includes=${includes}`)

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
        <div className="inlineSvg">
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
          className="input"
          placeholder="Search Titles..."
          onChange={(e) => setSearchField(e.target.value)}
        />
        <button
          className="inlineBtn"
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
          className="select"
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
          <div key={node.uid} className="card">
            <h5 className="h5">
              <SanitizedHTML allowedTags={['a', 'p']} html={node.title} />
            </h5>
            <p className="text">
              <i>{node.uid}</i>
            </p>
            <p className="text">
              <SanitizedHTML
                allowedTags={['a', 'p']}
                html={node.summary || ''}
              />
            </p>
            <div className="justify-center items-center">
              <div className="flex flex-row justify-center">
                <Form method="post" action="/playlists/add">
                  <button className="button" name="add-item" value={node.uid}>
                    add to playlist
                  </button>
                </Form>
                <div className="px-1"></div>
                <button className="button" name="add-item" value={node.uid}>
                  <NavLink
                    data-bs-toggle="tooltip"
                    title={node.uid}
                    data-bs-placement="top"
                    prefetch="render"
                    to={`/items/item/${node.uid}`}
                  >
                    show more
                  </NavLink>
                </button>
              </div>
            </div>
          </div>
        ))}
      <div>
        <div className="py-4 flex justify-center flex-row mx-auto">
          {pageInfo?.hasPreviousPage && (
            <button
              type="button"
              className="button"
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
              className="button"
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
