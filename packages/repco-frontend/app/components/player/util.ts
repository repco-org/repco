import type { MediaAsset } from '~/graphql/types'

export function createTrackFromMediaAsset(
  mediaAsset: MediaAsset,
  contentItemUid: string,
) {
  return mediaAsset.file
    ? {
        uid: mediaAsset.uid,
        title: mediaAsset.title,
        src: mediaAsset.file.contentUrl,
        contentItemUid: contentItemUid,
      }
    : undefined
}
