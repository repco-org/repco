import type { LoaderFunction } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export const loader: LoaderFunction = ({ request, params }) => {
  //ToDo: Database
  return authenticator.authenticate(params.provider as string, request, {
    successRedirect: '/playlists',
    failureRedirect: '/login',
  })
}
