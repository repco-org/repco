import type { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { SanitizedHTML } from '~/components/sanitized-html'
import { SearchBar } from '~/components/ui/bars/SearchBar'
import { ContentItemCard } from '~/components/ui/primitives/Card'
import type {
  LoadContentItemsQuery,
  LoadContentItemsQueryVariables,
} from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

const QUERY = gql`
  query LoadContentItems(
    $first: Int
    $last: Int
    $after: Cursor
    $before: Cursor
    $orderBy: [ContentItemsOrderBy!]
    $includes: String
  ) {
    contentItems(
      first: $first
      last: $last
      after: $after
      before: $before
      orderBy: $orderBy
      filter: { title: { includes: $includes } }
    ) {
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

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url)
  const after = url.searchParams.get('after')
  const before = url.searchParams.get('before')
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_ASC'
  const includes = url.searchParams.get('includes') || ''
  if (after && before) throw new Error('Invalid query arguments.')
  const last = before ? 10 : null
  const first = last ? null : 10

  return graphqlQuery<LoadContentItemsQuery, LoadContentItemsQueryVariables>(
    QUERY,
    {
      first: first,
      last: last,
      after: after,
      before: before,
      //@ts-ignore
      orderBy: orderBy,
      includes: includes,
    },
  )
}

export default function IndexRoute() {
  const { data } = useLoaderData<LoaderData>()

  return (
    <div className="md:w-full">
      <SearchBar path="/items" />
      <ul className="py-2 px-2">
        {data.contentItems?.nodes.map((node, i) => (
          <ContentItemCard key={i} node={node.uid} variant={'hover'}>
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
          </ContentItemCard>
        ))}
      </ul>
    </div>
  )
}
