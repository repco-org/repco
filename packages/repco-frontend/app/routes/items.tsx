import stylesUrl from '~/styles/index.css'
import type { LinksFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useVirtual } from 'react-virtual'
import { gql } from 'urql'
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

const LIMIT = 10

const getEndCourser = (searchParams: URLSearchParams) => ({
  after: searchParams.get('after'),
})

// type LoaderData = {
//   items: Array<{ id: string; value: string }>
//   totalItems: number
// }

export const loader: LoaderFunction = async ({ request }) => {
  const courser = getEndCourser(new URL(request.url).searchParams)
  // console.log('CURSOR', courser)

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
  //console.log('DATA ITEMS', data)
  const [contentItems, setContentItems] = useState(data.contentItems)
  const [items, setItems] = useState(data.contentItems.nodes)

  const fetcher = useFetcher()

  const page = useRef(contentItems.pageInfo.endCursor)
  const parentRef = useRef<HTMLDivElement>(null)

  const canFetchMore = items.length < contentItems.totalCount
  //console.log(canFetchMore)
  const rowVirtualizer = useVirtual({
    size: contentItems.totalCount,
    parentRef,
    initialRect: { width: 0, height: 800 },
    estimateSize: useCallback(() => 35, []),
  })

  useEffect(() => {
    const [lastItem] = [...rowVirtualizer.virtualItems].reverse()
    // console.log('!')

    if (!lastItem) {
      return
    }
    //  console.log('1')

    if (
      //lastItem.index > items.length - 1 &&
      canFetchMore &&
      fetcher.state === 'idle'
    ) {
      //  console.log('2')

      fetcher.load(`/items/?after=${page.current}`)
    }
  }, [canFetchMore, fetcher, items.length, page, rowVirtualizer.virtualItems])

  useEffect(() => {
    if (fetcher.data) {
      // console.log('tetch')
      setItems((prevItems: any) => [
        ...prevItems,
        ...fetcher.data.data.contentItems.nodes,
      ])
      setContentItems(fetcher.data.data.contentItems)
    }
  }, [fetcher.data])

  return (
    <main>
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
            const { index } = virtualRow
            const isLoaderRow = index > items.length - 1
            const item = items[index]
            console.log(item)
            //console.log(item)
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
                  width: '100% fit-content',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {isLoaderRow ? (
                  canFetchMore ? (
                    'Loading more...'
                  ) : (
                    'Nothing more to load'
                  )
                ) : (
                  <>
                    <span>{index}</span>
                    <span>{item.uid}</span>
                    <span>{item.summary}</span>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}
