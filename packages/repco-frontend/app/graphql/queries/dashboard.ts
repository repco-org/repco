import { gql } from 'urql'

export const DashboardQuery = gql`
  query LoadDashboardData($start: Datetime!, $end: Datetime!) {
    repos {
      nodes {
        did
        name
      }
      totalCount
    }
    contentItems(
      filter: {
        pubDate: { greaterThanOrEqualTo: $start, lessThanOrEqualTo: $end }
      }
    ) {
      nodes {
        pubDate
      }
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
    concepts {
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
    latestConetentItems: contentItems(last: 10) {
      nodes {
        title
        uid
      }
    }
    totalPublicationServices: publicationServices {
      totalCount
    }
    totalContentItems: contentItems {
      totalCount
    }
    contentGroupings {
      totalCount
    }
    dataSources {
      totalCount
      nodes {
        config
      }
    }
    sourceRecords {
      totalCount
    }
  }
`
