import type { LoaderFunction, MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { MediaDisplayTable } from '~/components/mediaDisplay/media-display-table'
import { SanitizedHTML } from '~/components/sanitized-html'
import { ContentItemQuery } from '~/graphql/queries/content-item'
import type {
  LoadContentItemQuery,
  LoadContentItemQueryVariables,
} from '~/graphql/types'
import { graphqlQuery } from '~/lib/graphql.server'

type LoaderData = { data: LoadContentItemQuery }

export const loader: LoaderFunction = ({ params }) => {
  const uid = params.uid
  if (!uid) throw new Error('Missing uid')
  return graphqlQuery<LoadContentItemQuery, LoadContentItemQueryVariables>(
    ContentItemQuery,
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
  const { data } = useLoaderData<typeof loader>()

  if (!data) {
    return 'Ooops, something went wrong :('
  }
  const node = data.contentItem
  if (!node) {
    return 'Not found'
  }
  return (
    <div>
      <h2 className="font-medium leading-tight text-4xl mt-0 mb-2 text-grey-600">
        {node.title}
      </h2>
      <p className="font-light leading-relaxed mt-0 mb-4 text-grey-600">
        <b>UID:</b> {node.uid}
        <br />
        <b>Revision:</b> {node.revisionId}
      </p>
      <div className="text-lg font-normal leading-normal mt-6 mb-4 text-grey-600">
        <SanitizedHTML html={node.content} />
      </div>
      {node.mediaAssets.nodes && (
        <MediaDisplayTable
          mediaAssets={node.mediaAssets.nodes}
          contentItemUid={node.uid}
        />
      )}
    </div>
  )
}
