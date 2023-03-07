import { gql } from 'urql'

export const RepoStatsQuery = gql`
  query LoadRepoStats($repoDid: String) {
    contentItems(filter: { revision: { repoDid: { equalTo: $repoDid } } }) {
      totalCount
    }
    repos(filter: { did: { equalTo: $repoDid } }) {
      nodes {
        name
      }
    }
  }
`
