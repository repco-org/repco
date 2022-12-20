import type { LoaderFunction } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export const loader: LoaderFunction = ({ request, params }) => {
  return authenticator.authenticate(params.provider || '', request, {
    successRedirect: '/',
    failureRedirect: '/login',
  })
}
