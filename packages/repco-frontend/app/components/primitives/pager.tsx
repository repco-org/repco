import type { PageInfo } from '~/graphql/types.js'
import { NextPageButton, PrevPageButton } from '../primitives/button'

export function Pager({
  pageInfo,
  orderBy,
  type,
  q,
  repoDid,
}: {
  pageInfo: PageInfo | undefined
  orderBy: string[]
  type: string[]
  q: string[]
  repoDid: string[]
}) {
  if (!pageInfo) return null
  return (
    <div className="py-4 flex justify-center flex-row mx-auto">
      {pageInfo?.hasPreviousPage && (
        <PrevPageButton
          prefetch="render"
          to={`/items?before=${pageInfo?.startCursor}&orderBy=${orderBy}&type=${type}&q=${q}&repoDid=${repoDid}`}
        />
      )}
      {pageInfo?.hasNextPage && (
        <NextPageButton
          prefetch="render"
          to={`/items?after=${pageInfo?.endCursor}&orderBy=${orderBy}&type=${type}&q=${q}&repoDid=${repoDid}`}
        />
      )}
    </div>
  )
}
