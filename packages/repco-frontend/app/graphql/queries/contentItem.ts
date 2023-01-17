import { gql } from 'urql'

export const ContentItemQuery = gql`
  query LoadContentItem($uid: String!) {
    contentItem(uid: $uid) {
      title
      uid
      content
      revisionId
      mediaAssets {
        nodes {
          uid
          mediaType
          file {
            uid
            contentUrl
          }
        }
      }
    }
  }
`
