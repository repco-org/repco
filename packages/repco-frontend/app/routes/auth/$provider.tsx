import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { redirect } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export const loader: LoaderFunction = () => {
  return redirect('/login')
}

export const action: ActionFunction = ({ request, params }) => {
  return authenticator.authenticate(params.provider || '', request, {
    throwOnError: true,
  })
}
