import { ActionFunction, LoaderFunction } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = async ({ request }) => {
  //TODO: query from repco db playlists
  return null
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const data = formData.get('add-item')
  const add = formData.get('add-item')

  console.log('DATA', data)
  console.log('ADD', data)

  return data
}

export default function Playlists() {
  const data = useActionData()
  const [playlists, setPlaylists] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
    }
  }, [data])

  return (
    <div className="px-6 py-6">
      {playlists.length !== 0 ? (
        playlists.map((e: any) => (
          <ul>
            <li className="font-medium">
              {e}
              <Form method="post">
                <button
                  className="mx-2 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-full w-5 h- text-sm dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  value={[e, data]}
                  name="add-to-playlist"
                  type="submit"
                >
                  +
                </button>
              </Form>
            </li>
          </ul>
        ))
      ) : (
        <div className="px-6 py-6">
          <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
            Create at least one Playlist
          </h1>
        </div>
      )}
    </div>
  )
}
