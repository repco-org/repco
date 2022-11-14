import type { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { SanitizedHTML } from '~/components/sanitized-html'
import { NavButton } from '~/components/ui/Button'
import { ContentItemCard } from '~/components/ui/Card'
import { Collapsible } from '~/components/ui/Collapsible'
import type {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types.js'
import { graphqlQuery, parsePagination } from '~/lib/graphql.server'

const QUERY = gql`
  query LoadContentItems(
    $first: Int
    $last: Int
    $after: Cursor
    $before: Cursor
  ) {
    contentItems(first: $first, last: $last, after: $after, before: $before) {
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
      nodes {
        title
        uid
        summary
      }
    }
  }
`

type LoaderData = { data: LoadContentItemsQuery }

export const loader: LoaderFunction = ({ request }) => {
  const url = new URL(request.url)
  const pagination = parsePagination(url)
  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    pagination,
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()
  if (!data) {
    return 'Ooops, something went wrong :('
  }
  if (!data.contentItems) {
    return 'No content items'
  }
  return (
    <div className="md:w-full">
      <ul className="py-2 px-2">
        {data.contentItems.nodes.map((node, i) => (
          <ContentItemCard node={node.uid} variant={'hover'}>
            <NavLink to={`item/${node.uid}`}>
              <h5 className="font-medium leading-tight text-xl text-blue-600">
                <SanitizedHTML allowedTags={['a', 'p']} html={node.title} />
              </h5>
            </NavLink>
            <p className="text-sm">
              <i>{node.uid}</i>
            </p>
            <p>
              <SanitizedHTML
                allowedTags={['a', 'p']}
                html={node.summary || ''}
              />
            </p>
            <div>
              <div>
                <NavButton to={`item/${node.uid}`} prefetch="render">
                  show more
                </NavButton>
              </div>
              <div>
                <Collapsible node={node.uid} />
              </div>
            </div>
          </ContentItemCard>
        ))}
      </ul>
    </div>
  )
}
