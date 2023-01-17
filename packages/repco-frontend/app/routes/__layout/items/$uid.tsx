import type { LoaderFunction, MetaFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { SanitizedHTML } from '~/components/sanitized-html'
import { ContentItemQuery } from '~/graphql/queries/contentItem'
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
  const { data } = useLoaderData<LoaderData>()

  if (!data) {
    return 'Ooops, something went wrong :('
  }
  const node = data.contentItem
  if (!node) {
    return 'Not found'
  }
  return (
    <div className="w-1/2 px-2 py-4">
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
      <ul className="list-disc">
        {node.mediaAssets.nodes.map((node: any) => (
          <li key={node.uid}>
            <p className="font-light leading-relaxed mt-0 mb-4 text-grey-600">
              <b>media asset </b>
              {node.uid}
            </p>
            <br />

            {node.file && (
              <div>
                <a
                  className="text-lg px-0 py-4 font-medium text-blue-600 dark:text-blue-500 hover:underline"
                  href={node.file.contentUrl}
                >
                  DOWNLOAD
                </a>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
