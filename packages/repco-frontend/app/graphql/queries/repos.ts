import { gql } from 'urql'

export const ReposQuery = gql`
  query LoadRepos {
    repos {
      nodes {
        did
        name
      }
    }
  }
`
