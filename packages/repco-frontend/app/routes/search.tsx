import { gql } from 'urql'

const QUERY = gql`
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

export default function Search() {
  return 'Search something'
}
