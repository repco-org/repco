import type {
  AnyVariables,
  OperationContext,
  OperationResult,
  TypedDocumentNode,
} from '@urql/core'
import { createClient } from '@urql/core'
import type { DocumentNode } from 'graphql'

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
