import type { MediaAsset } from '~/graphql/types'
import { PlayTrackButton } from '../player/player'
import { TrackDropdown } from '../player/track-dropdown'

export function FileWidget({
  mediaAsset,
  contentItemUid,
}: {
  mediaAsset: MediaAsset
  contentItemUid: string
}) {
  if (!mediaAsset.file?.contentUrl) return <></>
  if (mediaAsset.mediaType === 'image')
    return (
      <img
        className="w-32"
        alt={mediaAsset.title}
        src={mediaAsset.file?.contentUrl}
      />
    )

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
