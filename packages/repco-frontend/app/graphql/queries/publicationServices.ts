import { gql } from 'urql'

export const PublicationServicesQuery = gql`
  query LoadPublicationServices($totalCount: Int!) {
    publicationServices(first: $totalCount) {
      nodes {
        name
        contentItems {
          totalCount
        }
      }
    }
  }
`
