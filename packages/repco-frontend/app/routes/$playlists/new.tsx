import { ActionFunction } from '@remix-run/node'
import { useActionData } from '@remix-run/react'

export const action: ActionFunction = async ({ request }) => {
  let formData = await request.formData()
  console.log('FORMDATA', formData)

  return 'new'
}

export default function Playlists() {
  const some = useActionData()
  return some
}
