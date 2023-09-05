export const fetchContentItemsQuery = `
  query FetchContentItems($count: Int) {
    contentItems(first: $count) {
      nodes {
        title
        content
        uid
        revision {
          repo {
            name
          }
        }
        mediaAssets {
          nodes {
            mediaType
            file {
              contentUrl
            }
          }
        }
      }
    }
  }
`
