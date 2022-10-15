import { ActionFunction } from '@remix-run/node'
import { useActionData } from '@remix-run/react'

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const data = formData.get('add-item')
  console.log('FORMDATA', data)

  return data
}

export default function Playlists() {
  const some = useActionData()
  return some
}
