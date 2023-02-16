import sanitize from 'sanitize-html'
import type { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData, useSearchParams } from '@remix-run/react'
import { PlayTrackButton } from '~/components/player/Player'
import { TrackDropdown } from '~/components/player/trackDropdown'
import { createTrackFromMediaAsset } from '~/components/player/util'
import { Pager } from '~/components/ui/Pager'
import { ContentItemCard } from '~/components/ui/primitives/Card'
import { ContentItemsQuery } from '~/graphql/queries/contentItems'
import type {
  ContentItem,
  ContentItemFilter,
  ContentItemsOrderBy,
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
  StringFilter,
} from '~/graphql/types.js'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const includes = url.searchParams.get('includes')
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_ASC'
  const repoDid = url.searchParams.get('repoDid') || 'all'
  const { first, last, after, before } = parsePagination(url)
  let filter: ContentItemFilter | undefined = undefined
  if (includes) {
    const titleFilter: StringFilter = { includesInsensitive: includes }
    filter = { title: titleFilter }
  }

  if (repoDid && repoDid !== 'all') {
    const repoFilter = { repoDid: { equalTo: repoDid } }
    filter = { ...filter, revision: repoFilter }
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
          ...node,
          title: sanitize(node?.title, { allowedTags: [] }),
          summary: sanitize(node?.summary || '', { allowedTags: [] }),
        }
      }) || [],
    pageInfo: data?.contentItems?.pageInfo,
  }
}

export default function ItemsIndex() {
  const { nodes, pageInfo, repos } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const includes = searchParams.getAll('includes')
  const orderBy = searchParams.getAll('orderBy')
  return (
    <div>
      <div>
        {nodes.length === 0 && (
          <div>There is no content here that matches the set filters!</div>
        )}
        {nodes.map((node: ContentItem, i: number) => {
          const imageSrc = node.mediaAssets.nodes.find(
            (mediaAsset) => mediaAsset.mediaType === 'image',
          )?.file?.contentUrl

          const firstAudioAsset = node.mediaAssets.nodes.find(
            (mediaAsset) => mediaAsset.mediaType === 'audio',
          )

          const track =
            firstAudioAsset &&
            createTrackFromMediaAsset(firstAudioAsset, node.uid)
          return (
            <ContentItemCard key={i} variant={'hover'}>
              <div className="flex flex-col">
                <div className="flex align-middle space-x-4">
                  <div className="flex align-middle w-1/3 xl:w-1/6">
                    <img className=" object-contain" src={imageSrc} />
                  </div>
                  <div className="w-2/3 xl:w-5/6">
                    <NavLink to={`/items/${node.uid}`}>
                      <h5 className="break-words  font-medium leading-tight text-xl text-brand-primary">
                        {node.title}
                      </h5>
                    </NavLink>

                    <p className="text-xs">{node.summary || ''}</p>
                  </div>
                </div>
              </div>
              <div className="flex my-4 align-middle justify-between">
                {track && <PlayTrackButton track={track} />}
                {firstAudioAsset?.file?.duration}
                {track && <TrackDropdown track={track} />}
              </div>
            </ContentItemCard>
          )
        })}
      </div>
      <Pager pageInfo={pageInfo} orderBy={orderBy} includes={includes} />
    </div>
  )
}
