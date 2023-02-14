import sanitize from 'sanitize-html'
import type { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData, useSearchParams } from '@remix-run/react'
import { Pager } from '~/components/ui/Pager'
import { PlaylistDialog } from '~/components/ui/playlists/addTrackToPlaylistDialog'
import { Button } from '~/components/ui/primitives/Button'
import { ContentItemCard } from '~/components/ui/primitives/Card'
import { ContentItemsQuery } from '~/graphql/queries/contentItems'
import type {
  ContentItem,
  ContentItemFilter,
  ContentItemsOrderBy,
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
  MediaAsset,
  StringFilter,
} from '~/graphql/types.js'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'
import { useQueue } from '~/lib/usePlayQueue'

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

  if (repoDid && repoDid !== "all") {
    const repoFilter = {repoDid: {equalTo: repoDid}}
    filter = {...filter, revision:repoFilter}
  }
  console.warn("AFTER", filter, repoDid)
  
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

interface MediaDisplayProps {
  mediaAssets: MediaAsset[]
  contentItemUid: string
}

function useFileWidget(mediaAsset: MediaAsset, contentItemUid: string) {
  const { addTrack } = useQueue()
  if (!mediaAsset.file?.contentUrl) return
  if (mediaAsset.mediaType === 'image')
    return <img className="w-32" src={mediaAsset.file?.contentUrl} />

  const track = {
    title: mediaAsset.title,
    src: mediaAsset.file.contentUrl,
    uid: mediaAsset.fileUid,
    description: mediaAsset.description || undefined,
    contentItemUid: contentItemUid,
  }

  if (mediaAsset.mediaType === 'audio')
    return (
      <>
        <PlaylistDialog track={track} />
        <Button onClick={() => addTrack(track)}>add to Queue</Button>{' '}
      </>
    )
  return
}

export function MediaDisplay({ mediaAssets, contentItemUid }: MediaDisplayProps) {
  return (
    <table className="table-fixed">
      <thead>
        <tr>
          <th>Type</th>
          <th>Title</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {mediaAssets.map((mediaAsset, i) => (
          <tr key={i}>
            <td>{mediaAsset.mediaType}</td>
            <td>{mediaAsset.title}</td>
            <td>{useFileWidget(mediaAsset, contentItemUid)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ItemsIndex() {
  const { nodes, pageInfo, repos } = useLoaderData<typeof loader>()
  const [searchParams] = useSearchParams()
  const includes = searchParams.getAll('includes')
  const orderBy = searchParams.getAll('orderBy')
  return (
    <div>
      <div>
        {nodes.length === 0 && <div>There is no content here that matches the set filters!</div>}
        {nodes.map((node: ContentItem, i: number) => {
          return (
            <ContentItemCard key={i} node={node.uid} variant={'hover'}>
              <div>
                <div className="inline-flex w-full justify-between">
                  <NavLink to={`/items/${node.uid}`}>
                    <h5 className="break-words  font-medium leading-tight text-xl text-brand-primary">
                      {node.title}
                    </h5>
                  </NavLink>
                </div>
                <p className="text-sm">
                  <i className="break-all">{node.uid}</i>
                </p>
                <p className="break-words">{node.summary || ''}</p>
              </div>
              <MediaDisplay contentItemUid={node.uid} mediaAssets={node.mediaAssets.nodes} />
            </ContentItemCard>
          )
        })}
      </div>
      <Pager pageInfo={pageInfo} orderBy={orderBy} includes={includes} />
    </div>
  )
}
