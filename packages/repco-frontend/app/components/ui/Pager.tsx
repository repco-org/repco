import type { PageInfo } from '~/graphql/types.js'
import { NextButton, PrevButton } from './primitives/Button'

export function Pager({
  pageInfo,
  orderBy,
  includes,
}: {
  pageInfo: PageInfo | undefined
  orderBy: string[]
  includes: string[]
}) {
  if (!pageInfo) return null

  return (
    <div className="py-4 flex justify-center flex-row mx-auto">
      {pageInfo?.hasPreviousPage && (
        <PrevButton
          prefetch="render"
          to={`/items?before=${pageInfo?.startCursor}&orderBy=${orderBy}&includes=${includes}`}
        />
      )}
      {pageInfo?.hasNextPage && (
        <NextButton
          prefetch="render"
          to={`/items?after=${pageInfo?.endCursor}&orderBy=${orderBy}&includes=${includes}`}
        />
      )}
    </div>
  )
}
