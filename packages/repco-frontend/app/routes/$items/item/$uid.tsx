import type { LoaderFunction, MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { SanitizedHTML } from '~/components/sanitized-html'
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

export const meta: MetaFunction = ({ data }) => {
  const {
    data: { contentItem },
  } = data as LoaderData
  if (!contentItem) {
    return {
      title: 'repco',
    }
  }
  return {
    title: `${contentItem.title} | repco`,
  }
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()

  if (!data) {
    return 'Ooops, something went wrong :('
  }
  const node = data.contentItem
  if (!node) {
    return 'Not found'
  }
  return (
    <div>
      <h2>{node.title}</h2>
      <p>
        UID: <code>{node.uid}</code>
        <br />
        Revision: <code>{node.revisionId}</code>
      </p>
      <div>
        <SanitizedHTML html={node.content} />
      </div>
      <ul>
        {node.mediaAssets.nodes.map((node) => (
          <li key={node.uid}>
            media asset {node.uid}
            <br />
            {node.file && <a href={node.file.contentUrl}>download</a>}
          </li>
        ))}
      </ul>
    </div>
  )
}
