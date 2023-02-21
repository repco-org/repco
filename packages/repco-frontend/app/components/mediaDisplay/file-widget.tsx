import type { MediaAsset } from '~/graphql/types'
import { PlayTrackButton } from '../player/player'
import { TrackDropdown } from '../player/track-dropdown'
import { useQueue } from '../player/use-queue'

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
