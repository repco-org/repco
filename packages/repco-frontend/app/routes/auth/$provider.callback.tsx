import type { LoaderFunction } from '@remix-run/node'
import { authenticator } from '~/services/auth.server'

export const loader: LoaderFunction = async ({ request, params }) => {
  const res = await authenticator.authenticate(params.provider || '', request, {
    successRedirect: '/playlists',
    failureRedirect: '/login',
  })
  //ToDo: Database
  return res
}
