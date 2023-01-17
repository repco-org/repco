import sanitize from 'sanitize-html'
import type { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData, useSearchParams } from '@remix-run/react'
import { Pager } from '~/components/ui/Pager'
import { PlaylistDialog } from '~/components/ui/playlists/addTrack'
import { ContentItemCard } from '~/components/ui/primitives/Card'
import { ContentItemsQuery } from '~/graphql/queries/contentItems'
import type {
  ContentItemFilter,
  ContentItemsOrderBy,
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
  StringFilter,
} from '~/graphql/types.js'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

interface Node {
  title: string
  uid: string
  summary: string
}

interface PageInfo {
  startCursor: string
  endCursor: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

interface LoaderData {
  nodes: Node[]
  pageInfo: PageInfo
}

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const includes = url.searchParams.get('includes')
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_ASC'
  const { first, last, after, before } = parsePagination(url)
  let filter: ContentItemFilter | undefined = undefined
  if (includes) {
    const titleFilter: StringFilter = { includes }
    filter = { title: titleFilter }
  }
  const queryVariables = {
    first,
    last,
    after,
    before,
    orderBy: orderBy as ContentItemsOrderBy,
    filter,
  }

  const { data } = await graphqlQuery<
    LoadContentItemsQuery,
    LoadContentItemsQueryVariables
  >(ContentItemsQuery, queryVariables)
  return {
    nodes:
      data?.contentItems?.nodes.map((node) => {
        return {
          title: sanitize(node?.title, { allowedTags: [] }),
          uid: node?.uid,
          summary: sanitize(node?.summary || '', { allowedTags: [] }),
        }
      }) || [],
    pageInfo: data?.contentItems?.pageInfo,
  }
}

export default function ItemsIndex() {
  const { nodes, pageInfo } = useLoaderData<LoaderData>()
  const [searchParams] = useSearchParams()
  const includes = searchParams.getAll('includes')
  const orderBy = searchParams.getAll('orderBy')
  return (
    <div>
      <div>
        {nodes.map((node, i) => (
          <ContentItemCard key={i} node={node.uid} variant={'hover'}>
            <div>
              <div className="inline-flex w-full justify-between">
                <NavLink to={`/items/${node.uid}`}>
                  <h5 className="break-words  font-medium leading-tight text-xl text-brand-primary">
                    {node.title}
                  </h5>
                </NavLink>

                <PlaylistDialog track={node} />
              </div>
              <p className="text-sm">
                <i className="break-all">{node.uid}</i>
              </p>
              <p className="break-words">{node.summary || ''}</p>
            </div>
          </ContentItemCard>
        ))}
      </div>
      <Pager pageInfo={pageInfo} orderBy={orderBy} includes={includes} />
    </div>
  )
}
