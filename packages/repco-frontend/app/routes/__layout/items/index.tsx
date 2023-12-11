import sanitize from 'sanitize-html'
import type { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData, useSearchParams } from '@remix-run/react'
import { PlayTrackButton } from '~/components/player/player'
import { TrackDropdown } from '~/components/player/track-dropdown'
import { createTrackFromMediaAsset } from '~/components/player/util'
import { ContentItemCard } from '~/components/primitives/card'
import { Pager } from '~/components/primitives/pager'
import { ContentItemsQuery } from '~/graphql/queries/content-items'
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
  const type = url.searchParams.get('type')
  const q = url.searchParams.get('q')
  const orderBy = url.searchParams.get('orderBy') || 'PUB_DATE_DESC'
  const repoDid = url.searchParams.get('repoDid') || 'all'
  const { first, last, after, before } = parsePagination(url)
  let filter: ContentItemFilter | undefined = undefined
  if (type === 'title' && q) {
    const titleFilter: StringFilter = { includesInsensitive: q }
    filter = { title: titleFilter }
  }

  if (type === 'fulltext' && q) {
    const titleFilter: StringFilter = { includesInsensitive: q }
    const contentFilter: StringFilter = { includesInsensitive: q }
    filter = { or: [{ title: titleFilter }, { content: contentFilter }] }
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
          title: sanitize(node?.title[Object.keys(node?.title)[0]]['value'], { allowedTags: [] }),
          summary: sanitize(node?.summary[Object.keys(node?.title)[0]]['value'] || '', { allowedTags: [] }),
        }
      }) || [],
    pageInfo: data?.contentItems?.pageInfo,
  }
}

export default function ItemsIndex() {
  const { nodes, pageInfo } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const type = searchParams.getAll('type')
  const orderBy = searchParams.getAll('orderBy')
  const q = searchParams.getAll('q')
  const repoDid = searchParams.getAll('repoDid')

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
          const altText = node.mediaAssets.nodes.find(
            (mediaAsset) => mediaAsset.mediaType === 'image',
          )?.title

          const firstAudioAsset = node.mediaAssets.nodes.find(
            (mediaAsset) => mediaAsset.mediaType === 'audio',
          )

          const track =
            firstAudioAsset &&
            createTrackFromMediaAsset(firstAudioAsset, node.uid)
          return (
            <ContentItemCard key={i} variant={'hover'} variantsize={'full'}>
              <div className="flex flex-col w-full">
                <div className="flex align-middle md:space-x-4">
                  {imageSrc && (
                    <div className="flex align-middle mx-2 w-1/3 xl:w-1/6">
                      <img
                        className="object-contain"
                        src={imageSrc}
                        alt={altText}
                      />
                    </div>
                  )}
                  <div className={imageSrc ? 'w-2/3 xl:w-5/6' : 'w-full'}>
                    <div className="flex overflow-visible flex-col justify-between items-baseline py-2">
                      <NavLink to={`/items/${node.uid}`}>
                        <h3 className="break-words  font-medium leading-tight text-xl text-brand-primary">
                          {node.title}
                        </h3>
                      </NavLink>
                      <p className="text-xs text-slate-600">
                        {new Date(node.pubDate).toLocaleDateString()}
                        {node.publicationService?.name[Object.keys(node.publicationService?.name)[0]]['value'] && ' - '}
                        {node.publicationService?.name[Object.keys(node.publicationService?.name)[0]]['value']}
                      </p>
                    </div>
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
      <Pager
        pageInfo={pageInfo}
        orderBy={orderBy}
        type={type}
        q={q}
        repoDid={repoDid}
      />
    </div>
  )
}
