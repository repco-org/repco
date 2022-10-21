import type {
  AnyVariables,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core'
import { createClient } from '@urql/core'
import type { DocumentNode } from 'graphql'
import { LoadContentItemsQueryVariables } from '~/graphql/types.js'

export const graphqlClient = createClient({
  url: process.env.REPCO_URL || 'http://localhost:8765/graphql',
})

export function graphqlQuery<
  Data = any,
  Variables extends AnyVariables = AnyVariables,
>(
  query: DocumentNode | TypedDocumentNode<Data, Variables> | string,
  variables: Variables,
  context?: Partial<OperationContext>,
): Promise<OperationResult<Data, Variables>> {
  return graphqlClient.query(query, variables, context).toPromise()
}

export function parsePagination(url: URL): LoadContentItemsQueryVariables {
  const after = url.searchParams.get('after')
  const before = url.searchParams.get('before')
  const orderBy = url.searchParams.get('orderBy') || 'TITLE_ASC'
  const includes = url.searchParams.get('includes') || ''
  if (after && before) throw new Error('Invalid query arguments.')
  const last = before ? 10 : null
  const first = last ? null : 10
  const variables = {
    first,
    last,
    after,
    before,
    orderBy,
    includes,
  }
  return variables
}
