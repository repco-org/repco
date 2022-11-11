import { LoaderFunction } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import { gql } from '@urql/core'
import { useRef, useState } from 'react'
import { SanitizedHTML } from '~/components/sanitized-html'
import {
  Button,
  NavButton,
  NextButton,
  PrevButton,
} from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
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

export const loader: LoaderFunction = ({ request }) => {
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
  console.log(data)

  const [orderBy, setOrderBy] = useState('')
  const [includes, setIncludes] = useState('')

  const [searchField, setSearchField] = useState('')

  const formRef = useRef<HTMLFormElement>(null)

  return (
    <main>
      <Form action="/items" method="get">
        <div className="relative">
          <Input
            type="search"
            id="default-search"
            name="includes"
            variant="withBtn"
            placeholder="Search Titles..."
            onChange={(e) => setSearchField(e.target.value)}
          />

          <Button
            type="submit"
            variant="inline"
            onClick={() => {
              setIncludes(searchField)
            }}
          >
            Search
          </Button>
        </div>
      </Form>

      <div>
        <Form ref={formRef} method="get" action="/">
          <label>Order By </label>
          <select value="Bla" onChange={() => formRef.current?.submit()}>
            <option value="TITLE_ASC">Title ASC</option>
            <option value="TITLE_DESC">Title DESC</option>
          </select>{' '}
        </Form>
      </div>

      {data.contentItems?.nodes &&
        data.contentItems?.nodes.map((node, i) => (
          <Card key={i}>
            <h5 className="h5">
              <SanitizedHTML allowedTags={['a', 'p']} html={node.title} />
            </h5>
            <p className="text">
              <i>{node.uid}</i>
            </p>
            <p className="text">
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
      <div className="py-4 flex justify-center flex-row mx-auto">
        {data.contentItems?.pageInfo?.hasPreviousPage && (
          <PrevButton
            prefetch="render"
            to={`/items?before=${data.contentItems?.pageInfo?.startCursor}&orderBy=${orderBy}&includes=${includes}`}
          />
        )}
        {data.contentItems?.pageInfo?.hasNextPage && (
          <NextButton
            prefetch="render"
            to={`/items?after=${data.contentItems?.pageInfo?.endCursor}&orderBy=${orderBy}&includes=${includes}`}
          />
        )}
      </div>
    </main>
  )
}
