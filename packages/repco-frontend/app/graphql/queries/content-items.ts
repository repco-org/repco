import { gql } from 'urql'

export const ContentItemsQuery = gql`
  query LoadContentItems(
    $first: Int
    $last: Int
    $after: Cursor
    $before: Cursor
    $orderBy: [ContentItemsOrderBy!]
    $filter: ContentItemFilter
    $condition: ContentItemCondition
  ) {
    contentItems(
      first: $first
      last: $last
      after: $after
      before: $before
      orderBy: $orderBy
      filter: $filter
      condition: $condition
    ) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      totalCount
      nodes {
        pubDate
        title
        uid
        subtitle
        summary
        mediaAssets {
          nodes {
            duration
            licenseUid
            mediaType
            title
            uid
            files {
              nodes {
                contentUrl
                mimeType
              }
            }
          }
        }
        publicationService {
          name
        }
      }
    }
  }
`
