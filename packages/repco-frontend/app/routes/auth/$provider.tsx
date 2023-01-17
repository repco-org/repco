import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export const loader: LoaderFunction = () => {
  console.log('LOADER')
  return redirect('/login')
}

export const action: ActionFunction = async ({ request, params }) => {
  console.log('ACTION')
  return await authenticator.authenticate(params.provider as string, request)
}
