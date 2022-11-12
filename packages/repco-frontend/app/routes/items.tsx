import { LoaderFunction } from '@remix-run/node'
import { Form, useLoaderData, useSearchParams } from '@remix-run/react'
import { gql } from '@urql/core'
import { SanitizedHTML } from '~/components/sanitized-html'
import { Button, NavButton } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Pager } from '~/components/ui/Pager'
import { SearchBar } from '~/components/ui/SearchBar'
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

  const [searchParams] = useSearchParams()
  const includes = searchParams.getAll('includes')
  const orderBy = searchParams.getAll('orderBy')
  return (
    <main className="px-2">
      <SearchBar path="/items" />

      {data.contentItems?.nodes &&
        data.contentItems?.nodes.map((node, i) => (
          <Card key={i}>
            <h5 className="font-medium leading-tight text-xl mt-0 mb-2 text-blue-600">
              <SanitizedHTML allowedTags={['a', 'p']} html={node.title} />
            </h5>
            <p className="text-sm">
              <i>{node.uid}</i>
            </p>
            <p>
              <SanitizedHTML
                allowedTags={['a', 'p']}
                html={node.summary || ''}
              />
            </p>
            <div className="flex flex-row ">
              <Form method="post" action="/playlists/add">
                <Button name="add-item" value={node.uid}>
                  add to playlist
                </Button>
              </Form>
              <div className="px-1"></div>

              <NavButton to={`item/${node.uid}`} prefetch="render">
                show more
              </NavButton>
            </div>
          </Card>
        ))}
      <Pager
        pageInfo={data.contentItems?.pageInfo}
        orderBy={orderBy}
        includes={includes}
      />
    </main>
  )
}
