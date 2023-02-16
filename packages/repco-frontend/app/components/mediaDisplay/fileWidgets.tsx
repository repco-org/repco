import type { MediaAsset } from '~/graphql/types'
import { useQueue } from '~/lib/usePlayQueue'
import { PlayTrackButton } from '../player/Player'
import { TrackDropdown } from '../player/trackDropdown'

export function FileWidget({
  mediaAsset,
  contentItemUid,
}: {
  mediaAsset: MediaAsset
  contentItemUid: string
}) {
  const { tracks } = useQueue()
  if (!mediaAsset.file?.contentUrl) return <></>
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
      <div className="flex space-x-1">
        {track && <PlayTrackButton track={track} />}
        {track && <TrackDropdown track={track} />}
      </div>
    )

  return <></>
}
