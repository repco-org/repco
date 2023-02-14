import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export const loader: LoaderFunction = () => {
  return redirect('/login')
}

export const action: ActionFunction = async ({ request, params }) => {
  return await authenticator.authenticate(params.provider as string, request)
}
