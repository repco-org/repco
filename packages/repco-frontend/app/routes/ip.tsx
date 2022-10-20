import { LoaderFunction } from '@remix-run/node'
import { useFetcher, useLoaderData } from '@remix-run/react'
import { useEffect, useRef, useState } from 'react'
import { gql } from 'urql'
import { graphqlQuery } from '~/lib/graphql.server'

const FIRST = 50

const QUERY = gql`
  query LoadContentItemsByOffset(
    $after: Cursor
    $first: Int
    $orderBy: [ContentItemsOrderBy!]
    $includes: String
  ) {
    contentItems(
      after: $after
      first: $first
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
//TODO intersection observer query via offset .... bevor minus... next + offset

interface parseNumberParams {
  value: string | null
  defaultValue: number
}
const parseNumber = ({ value, defaultValue }: parseNumberParams) => {
  return typeof value === 'string' ? parseInt(value) : defaultValue
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const after = url.searchParams.get('page')

  const orderBy = url.searchParams.get('order') || 'TITLE_ASC'
  const includes = url.searchParams.get('includes') || ''

  return await graphqlQuery(QUERY, {
    after: after,
    first: FIRST,
    orderBy: orderBy,
    includes: includes,
  })
}

export default function Ip() {
  const { data } = useLoaderData<typeof loader>()
  const [pageInfo, setPageInfo] = useState(data.contentItems.pageInfo)
  const [itemsToRender, setItemsToRender] = useState(data.contentItems.nodes)
  const [fetchMore, setFetchMore] = useState(true)

  const fetcher = useFetcher()
  const parentRef = useRef<any>()
  const startRef = useRef<any>()
  useEffect(() => {
    const observer = new IntersectionObserver((entries: any) => {
      console.log(entries)
      const entry = entries[0]
      const start = entries[1]
      if (entry.isIntersecting) {
        if (!pageInfo.hasNextPage) return
        if (pageInfo.hasNextPage) {
          fetcher.load(`/ip?page=${pageInfo.endCursor}`)
          if (fetcher.data) {
            setItemsToRender(fetcher.data.data.contentItems.nodes)
          }
          setPageInfo(fetcher.data.data.contentItems.pageInfo)
        }
      }

      if (start.isIntersecting) {
        if (pageInfo.hasPreviousPage) return
        if (pageInfo.hasPreviousPage) {
          fetcher.load(`/ip?page=${pageInfo.startCursor}`)
          if (fetcher.data) {
            setItemsToRender(fetcher.data.data.contentItems.nodes)
          }
          setPageInfo(fetcher.data.data.contentItems.pageInfo)
        }
      }
    })

    observer.observe(parentRef.current)
    observer.observe(startRef.current)
  })

  return (
    <div>
      <div className="start" ref={startRef}></div>
      {itemsToRender.map((e: any, index: any) => (
        <div className="h-10" key={e.uid}>
          {index}: {e.uid}
        </div>
      ))}
      <div className="end" ref={parentRef}></div>
    </div>
  )
}
