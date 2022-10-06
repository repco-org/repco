import { LoaderFunction } from '@remix-run/node'
import { gql } from 'urql'
import type {
  LoadContentItemQuery,
  LoadContentItemQueryVariables,
} from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

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

type LoaderData = { data: LoadContentItemQuery }

export const loader: LoaderFunction = ({ params }) => {
  const uid = params.uid
  if (!uid) throw new Error('Missing uid')
  return graphqlQuery<LoadContentItemQuery, LoadContentItemQueryVariables>(
    QUERY,
    { uid },
  )
}

export default function Search() {
  return (
    <form method="get" action="/search">
      <label>
        Search <input name="term" type="text" />
      </label>
      <button type="submit">Search</button>
    </form>
  )
}
