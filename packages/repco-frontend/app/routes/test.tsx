import stylesUrl from '~/styles/index.css'
import type { LinksFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { gql } from 'urql'
import { graphqlQuery } from '~/lib/graphql.server'

export const links: LinksFunction = () => {
  return [{ rel: 'stylesheet', href: stylesUrl }]
}

const QUERY = gql`
  query LoadContentItems1(
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

const LIMIT = 200

const getEndCourser = (searchParams: URLSearchParams) => ({
  after: searchParams.get('after'),
})

// type LoaderData = {
//   items: Array<{ id: string; value: string }>
//   totalItems: number
// }

export const loader: LoaderFunction = async ({ request }) => {
  const courser = getEndCourser(new URL(request.url).searchParams)
  const data = await graphqlQuery(QUERY, {
    first: 10,
    last: null,
    after: courser.after,
    before: null,
  })
  // totalItems: await countItems(),

  return json(data)
}

export default function Index() {
  const { data } = useLoaderData()
  console.log('DATA', data)
  //   const [items, setItems] = useState(data.items)

  //   const fetcher = useFetcher()

  //   const page = useRef(0)
  //   const parentRef = useRef<HTMLDivElement>(null)

  //   const canFetchMore = items.length < data.totalItems

  //   const rowVirtualizer = useVirtual({
  //     size: data.totalItems,
  //     parentRef,
  //     initialRect: { width: 0, height: 800 },
  //     estimateSize: useCallback(() => 35, []),
  //   })

  //   useEffect(() => {
  //     const [lastItem] = [...rowVirtualizer.virtualItems].reverse()

  //     if (!lastItem) {
  //       return
  //     }

  //     if (
  //       lastItem.index > items.length - 1 &&
  //       canFetchMore &&
  //       fetcher.state === 'idle' &&
  //       page.current < items.length / LIMIT
  //     ) {
  //       page.current += 1
  //       fetcher.load(`/page/alternative?page=${page.current}`)
  //     }
  //   }, [canFetchMore, fetcher, items.length, page, rowVirtualizer.virtualItems])

  //   useEffect(() => {
  //     if (fetcher.data) {
  //       setItems((prevItems) => [...prevItems, ...fetcher.data.items])
  //     } const [items, setItems] = useState(data.items)

  //     const fetcher = useFetcher()

  //     const page = useRef(0)
  //     const parentRef = useRef<HTMLDivElement>(null)

  //     const canFetchMore = items.length < data.totalItems

  //     const rowVirtualizer = useVirtual({
  //       size: data.totalItems,
  //       parentRef,
  //       initialRect: { width: 0, height: 800 },
  //       estimateSize: useCallback(() => 35, []),
  //     })

  //     useEffect(() => {
  //       const [lastItem] = [...rowVirtualizer.virtualItems].reverse()

  //       if (!lastItem) {
  //         return
  //       }

  //       if (
  //         lastItem.index > items.length - 1 &&
  //         canFetchMore &&
  //         fetcher.state === 'idle' &&
  //         page.current < items.length / LIMIT
  //       ) {
  //         page.current += 1
  //         fetcher.load(`/page/alternative?page=${page.current}`)
  //       }
  //     }, [canFetchMore, fetcher, items.length, page, rowVirtualizer.virtualItems])

  //     useEffect(() => {
  //       if (fetcher.data) {
  //         setItems((prevItems) => [...prevItems, ...fetcher.data.items])
  //       }
  //     }, [fetcher.data])

  //     return (
  //       <main>
  //         <h1>
  //           Infinite Scrolling (pages loaded {page.current + 1}/
  //           {data.totalItems / LIMIT})
  //         </h1>

  //         <div
  //           ref={parentRef}
  //           className="List"
  //           style={{
  //             height: `800px`,
  //             width: `100%`,
  //             overflow: 'auto',
  //           }}
  //         >
  //           <div
  //             style={{
  //               height: `${rowVirtualizer.totalSize}px`,
  //               width: '100%',
  //               position: 'relative',
  //             }}
  //           >
  //             {rowVirtualizer.virtualItems.map((virtualRow) => {
  //               const { index } = virtualRow
  //               const isLoaderRow = index > items.length - 1
  //               const item = items[index]

  //               return (
  //                 <div
  //                   key={virtualRow.key}
  //                   className={`list-item ${
  //                     virtualRow.index % 2 ? 'list-item--odd' : 'list-item--even'
  //                   }`}
  //                   style
  //   }, [fetcher.data])

  //   return (
  //     <main>
  //       <h1>
  //         Infinite Scrolling (pages loaded {page.current + 1}/
  //         {data.totalItems / LIMIT})
  //       </h1>

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
  //             const { index } = virtualRow
  //             const isLoaderRow = index > items.length - 1
  //             const item = items[index]

  //             return (
  //               <div
  //                 key={virtualRow.key}
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
  //                 {isLoaderRow ? (
  //                   canFetchMore ? (
  //                     'Loading more...'
  //                   ) : (
  //                     'Nothing more to load'
  //                   )
  //                 ) : (
  //                   <>
  //                     <span>{index}</span>
  //                     <span>{item.value}</span>
  //                   </>
  //                 )}
  //               </div>
  //             )
  //           })}
  //         </div>
  //       </div>
  //     </main>
  //   )
  //  data.contentItems.nodes.map((e: any) => console.log(e))

  return (
    <div>
      {data && (
        <>
          {data.contentItems.nodes.map((node: any) => (
            <div key={node.uid}>
              {node.uid}: {node.title}
            </div>
          ))}
        </>
      )}
    </div>
  )
}