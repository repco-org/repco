import { gql } from 'urql'

export const DashboardQuery = gql`
  query LoadDashboardData {
    repos {
      nodes {
        did
        name
      }
      totalCount
    }
    contentItems {
      totalCount
    }
    mediaAssets {
      totalCount
    }
    files {
      totalCount
    }
    commits {
      totalCount
    }
    publicationServices {
      totalCount
      nodes {
        name
        contentItems {
          totalCount
        }
      }
    }
  }
`
