import type { LoaderFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { Pager } from '~/components/pager'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { SearchBar } from '~/components/ui/SearchBar'
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
    <main>
      <SearchBar></SearchBar>
      <Pager url="/items" pageInfo={data.contentItems.pageInfo} />

      {data.contentItems.nodes.map((node, i) => (
        <Card variant="default" key={i}>
          <h2>
            <Link to={`/item/${node.uid}`}>{node.uid}</Link>
            <Button variantSize="sm">Test</Button>
          </h2>
        </Card>
      ))}
    </main>
  )
}
