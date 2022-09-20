import stylesUrl from '~/styles/index.css'
import type { LinksFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { gql } from 'urql'
import {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types'
//import { getItems } from "~/utils/backend.server";
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }]
}

const LIMIT = 10
const FIRST = 10

const getStartLimit = (searchParams: URLSearchParams) => ({
  start: Number(searchParams.get('start') || '0'),
  limit: Number(searchParams.get('limit') || LIMIT.toString()),
  after: String(searchParams.get('after')),
  before: String(searchParams.get('before')),
  //if (after && before) throw new Error('Invalid query arguments.')
  // const last = before ? 2 : null
  // const first = last ? null : 2
  // const variables = {
  //   start,
  //   limit,
  //   after,
  //   before,
  // }
  // return variables
})

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
      edges {
        cursor
        node {
          uid
        }
      }
      nodes {
        title
        uid
        summary
      }
    }
  }
`

// type LoaderData = {
//   items: Array<{ id: string; value: string }>;
// };

type LoaderData = { data: any }

// export const loader: LoaderFunction = async ({ request }) => {
//   const { start, limit, before, after } = getStartLimit(
//     new URL(request.url).searchParams,
//   )
//   console.log(start, limit, before, after)
//   const data: LoaderData = {
//     data: await graphqlQuery(QUERY, { start, limit }),
//   }
//   return json(data, {
//     headers: {
//       'Cache-Control': 'public, max-age=120',
//     },
//   })
// }

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const pagination = parsePagination(url)
  const data: LoaderData = {
    data: await graphqlQuery<
      LoadContentItemsQuery,
      LoadContentItemsQueryVariables
    >(QUERY, pagination),
  }
  return json(data, {
    headers: {
      'Cache-Control': 'public, max-age=120',
    },
  })
}

export default function Index() {
  const { data } = useLoaderData<LoaderData>()
  const [after, setAfter] = useState('')
  const fetcher = useFetcher()

  useEffect(() => {
    if (after === data.data.contentItems.pageInfo.startCursor) return
    console.log('FETCHER DATA', fetcher.data)
    fetcher.load(`/itemsNew?after=${after}`)
    setAfter('')
  }, [after, FIRST, fetcher])

  console.log(after, FIRST, fetcher)
  useEffect(() => {
    if (fetcher.data) {
      console.log('FETCER DATA: ', fetcher.data)

      //   setAfter((prevItems) => [...prevItems, ...fetcher.data.contentItems.nodes])
    }
  }, [fetcher.data])

  return (
    <div>
      {data.data.contentItems && (
        <>
          {data.data.contentItems.nodes.map((node: any) => (
            <div key={node.uid}>
              {node.uid}: {node.name}
            </div>
          ))}

          {data.data.contentItems.pageInfo.hasNextPage && (
            <button
              onClick={() =>
                setAfter(data.data.contentItems.pageInfo.endCursor)
              }
            >
              load more
            </button>
          )}
        </>
      )}
    </div>
  )
}
//------------------------------------------------

// import stylesUrl from '~/styles/index.css'
// import type { LinksFunction, LoaderFunction } from '@remix-run/node'
// import { useFetcher, useLoaderData, useTransition } from '@remix-run/react'
// import { useCallback, useRef, useState } from 'react'
// import { useVirtual } from 'react-virtual'
// import { gql } from 'urql'
// import { Pager } from '~/components/pager'
// import {
//   LoadContentItemsQuery,
//   LoadContentItemsQueryVariables,
// } from '~/graphql/types'
// import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

// export const links: LinksFunction = () => {
//   return [{ rel: 'stylesheet', href: stylesUrl }]
// }
// const LIMIT = 200
// const DATA_OVERSCAN = 40

// const QUERY = gql`
//   query LoadContentItems(
//     $first: Int
//     $last: Int
//     $after: Cursor
//     $before: Cursor
//   ) {
//     contentItems(first: $first, last: $last, after: $after, before: $before) {
//       pageInfo {
//         startCursor
//         endCursor
//         hasNextPage
//         hasPreviousPage
//       }
//       totalCount
//       edges {
//         cursor
//         node {
//           uid
//         }
//       }
//       nodes {
//         title
//         uid
//         summary
//       }
//     }
//   }
// `

// type LoaderData = { data: LoadContentItemsQuery }

// export const loader: LoaderFunction = ({ request }) => {
//   const url = new URL(request.url)
//   const pagination = parsePagination(url)
//   return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
//     QUERY,
//     pagination,
//   )
// }

// export default function IndexRoute() {
//   const { data } = useLoaderData<LoaderData>()
//   const [items, setItems] = useState(data.contentItems)
//   const transition = useTransition()
//   const fetcher = useFetcher()
//   const startRef = useRef(data.contentItems?.pageInfo.endCursor)
//   const parentRef = useRef<HTMLDivElement>(null)
//   const rowVirtualizer = useVirtual({
//     size: data.contentItems?.nodes.length || 0,
//     parentRef,
//     estimateSize: useCallback(() => 35, []),
//     initialRect: { width: 0, height: 800 },
//   })

//   let newStart = startRef.current

//   console.log(transition.state)
//   // useEffect(() => {
//   //   if (newStart === startRef.current) return

//   //   startRef.current = newStart

//   //   fetcher.load(`/itemsNew?after=${data.contentItems?.pageInfo.endCursor}`)
//   // }, [newStart, fetcher])

//   // useEffect(() => {
//   //   if (fetcher.data) {
//   //     setItems((prevItems) => [...prevItems, ...fetcher.data.contentItems])
//   //   }
//   // }, [fetcher.data])

//   return (
//     <main>
//       <h1>
//         Simple Infinite Scrolling (pages loaded /
//         {data.contentItems?.totalCount! / 2})
//       </h1>
//       <Pager url="/itemsNew" pageInfo={data.contentItems!.pageInfo} />
//       <div
//         ref={parentRef}
//         className="List"
//         style={{
//           height: `800px`,
//           width: `100%`,
//           overflow: 'auto',
//         }}
//       >
//         <div
//           style={{
//             height: `${rowVirtualizer.totalSize}px`,
//             width: '100%',
//             position: 'relative',
//           }}
//         >
//           {rowVirtualizer.virtualItems.map((virtualRow) => {
//             const item = items?.nodes[virtualRow.index]

//             return (
//               <div
//                 key={item?.uid}
//                 className={`list-item ${
//                   virtualRow.index % 2 ? 'list-item--odd' : 'list-item--even'
//                 }`}
//                 style={{
//                   position: 'absolute',
//                   top: 0,
//                   left: 0,
//                   width: '100%',
//                   height: `${virtualRow.size}px`,
//                   transform: `translateY(${virtualRow.start}px)`,
//                 }}
//               >
//                 <span>
//                   {item
//                     ? item.uid
//                     : transition.state === 'loading'
//                     ? 'Loading more...'
//                     : 'Nothing to see here...'}
//                 </span>
//                 <span>
//                   {item
//                     ? item.title
//                     : transition.state === 'loading'
//                     ? 'Loading more...'
//                     : 'Nothing to see here...'}
//                 </span>
//                 <span>
//                   {item
//                     ? item.summary
//                     : transition.state === 'loading'
//                     ? 'Loading more...'
//                     : 'Nothing to see here...'}
//                 </span>
//               </div>
//             )
//           })}
//         </div>
//       </div>
//     </main>
//   )
// }

//----------------------------------------

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
