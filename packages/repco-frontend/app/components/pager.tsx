import type { PageInfo } from '~/graphql/types.js'

export function Pager({
  pageInfo,
  url,
  orderBy,
  includes,
}: {
  pageInfo: PageInfo
  url: string
  orderBy: string
  includes: string
}) {
  if (!pageInfo) return null
  const pager = {
    next:
      pageInfo.hasNextPage &&
      `${url}?after=${pageInfo.endCursor}&orderBy${orderBy}=&includes=${includes}`,
    prev:
      pageInfo.hasPreviousPage &&
      `${url}?before=${pageInfo.startCursor}&orderBy=&includes=`,
  }
  return (
    <div>
      {pager.next && <a href={pager.next}>Next page</a>}
      {pager.prev && <a href={pager.prev}>Previous page</a>}
    </div>
  )
}
