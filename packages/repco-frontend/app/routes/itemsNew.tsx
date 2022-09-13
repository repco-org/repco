import stylesUrl from '~/styles/index.css'
import type { LinksFunction, LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData, useTransition } from '@remix-run/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVirtual } from 'react-virtual'
import { gql } from 'urql'
import {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }]
}
const LIMIT = 200
const DATA_OVERSCAN = 40

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
  const [items, setItems] = useState(data.contentItems)
  const transition = useTransition()
  const fetcher = useFetcher()
  const startRef = useRef(0)
  const page = useRef(0)

  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtual({
    size: data.contentItems?.nodes.length || 0,
    parentRef,
    estimateSize: useCallback(() => 35, []),
    initialRect: { width: 0, height: 800 },
  })

  const [lastVirtualItem] = [...rowVirtualizer.virtualItems].reverse()
  if (!lastVirtualItem) {
    throw new Error('this should never happen')
  }

  let newStart = startRef.current
  const upperBoundary = startRef.current + LIMIT - DATA_OVERSCAN

  if (lastVirtualItem.index > upperBoundary) {
    // user is scrolling down. Move the window down
    newStart = startRef.current + LIMIT
  }

  useEffect(() => {
    if (newStart === startRef.current) return

    startRef.current = newStart
    page.current += 1

    fetcher.load(`/itemsNew?page=${page.current}`)
  }, [page, newStart, fetcher])

  useEffect(() => {
    if (fetcher.data) {
      setItems((prevItems) => [...prevItems, ...fetcher.data.contentItems])
    }
  }, [fetcher.data])

  return (
    <main>
      <h1>
        Simple Infinite Scrolling (pages loaded {page.current + 1}/
        {data.contentItems?.totalCount! / LIMIT})
      </h1>

      <div
        ref={parentRef}
        className="List"
        style={{
          height: `800px`,
          width: `100%`,
          overflow: 'auto',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.totalSize}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.virtualItems.map((virtualRow) => {
            const item = items?.nodes[virtualRow.index]

            return (
              <div
                key={virtualRow.key}
                className={`list-item ${
                  virtualRow.index % 2 ? 'list-item--odd' : 'list-item--even'
                }`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <span>{virtualRow.index}</span>
                <span>
                  {item
                    ? item.uid
                    : transition.state === 'loading'
                    ? 'Loading more...'
                    : 'Nothing to see here...'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
//   const { data } = useLoaderData<LoaderData>()
//   const [after, setAfter] = useState(data.contentItems?.pageInfo.endCursor)
//   const transition = useTransition()
//   const fetcher = useFetcher()
//   const startRef = useRef(0)
//   const parentRef = useRef<HTMLDivElement>(null)
//   //const page = useRef(0)
//   let newStart = startRef.current
//   useEffect(() => {
//     if (newStart == startRef.current) return
//   })

//   const [result] = useQuery({
//     query: QUERY,
//     variables: { query, first: limit },
//   })
//   //  const { data, fetching, error } = result

//   // const searchResults = data?.search
//   console.log('RESULT', result)
//   console.log(data.contentItems!.pageInfo.endCursor!)
//   return (
//     <div>
//       {data.contentItems && (
//         <>
//           {data.contentItems.nodes.map((node: any) => (
//             <div key={node.uid}>
//               {node.uid}: {node.title}
//             </div>
//           ))}

//           {data.contentItems.pageInfo.hasNextPage && (
//             <button
//               onClick={() => setAfter(data.contentItems!.pageInfo.endCursor!)}
//             >
//               load more
//             </button>
//           )}
//         </>
//       )}
//     </div>
//   )
// }

// export default itemsNew
