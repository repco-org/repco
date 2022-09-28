import type { PageInfo } from '~/graphql/types.js'

export function Pager({ pageInfo, url }: { pageInfo: PageInfo; url: string }) {
  if (!pageInfo) return null
  const pager = {
    next: pageInfo.hasNextPage && `${url}?after=${pageInfo.endCursor}`,
    prev: pageInfo.hasPreviousPage && `${url}?before=${pageInfo.startCursor}`,
  }
  return (
    <div>
      {pager.next && <a href={pager.next}>Next page</a>}
      {pager.prev && <a href={pager.prev}>Previous page</a>}
    </div>
  )
}
