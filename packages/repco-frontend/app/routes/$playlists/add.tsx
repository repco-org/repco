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
  const add = formData.get('add-to-playlist')
  if (!add) return data
  return add
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
              <Form method="post">
                <div className="relative">
                  {e}
                  <button
                    className="text-white mx-6 my-2
                     bottom-1.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                    value={[e, data]}
                    name="add-to-playlist"
                    type="submit"
                  >
                    +
                  </button>
                </div>
              </Form>
            </li>
          </ul>
        ))
      ) : (
        <div className="px-6 py-6">
          <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
            Create at least one Playlist
          </h1>
          <Form method="post" action="/playlists/new">
            <div className="flex flex-row py-2 px-4">
              <input
                type="text"
                name="create-playlist"
                id="create-playlist"
                className=" block p-2 pl-6 w-1/4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="enter name..."
              />
              <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                create new playlist
              </button>
            </div>
          </Form>
        </div>
      )}
    </div>
  )
}
