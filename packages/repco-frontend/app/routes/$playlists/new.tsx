import { ActionFunction } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { addToLocalStorageArray, localStorageItemToArray } from '~/lib/helpers'

//TODO mutation query to repco db, some better ui maybe with sorting
export const action: ActionFunction = async ({ request }) => {
  let formData = await request.formData()
  const data = (formData.get('create-playlist') || '').toString()
  const timestamp = Date.now()
  const date = new Date(timestamp)
  const dd_mm_yyyy = date.toLocaleDateString()
  const time = date.toLocaleTimeString()
  return data + ' ' + dd_mm_yyyy + ' ' + time
}
/**
 * Add an item to a localStorage() array
 * @param {String} name  The localStorage() key
 * @param {String} value The localStorage() value
 */

export default function New() {
  const data = useActionData()
  const [playlists, setPlaylists] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      addToLocalStorageArray('playlists', data)
      setPlaylists(localStorageItemToArray('playlists'))
    }
  }, [data])
  return (
    <div>
      <Form method="post" action="/playlists/new">
        <div className="relative">
          <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
            <svg
              aria-hidden="true"
              className="w-5 h-5 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
            </svg>
          </div>
          <input
            type="text"
            name="create-playlist"
            id="create-playlist"
            className="block p-4 pl-10 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="Search Titles..."
          />
          <button className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            create new playlist
          </button>
        </div>
      </Form>
      <div className="px-6">
        {playlists.map((e: string, index: number) => (
          <ul>
            {playlists.length === index + 1 ? (
              <li>
                <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-green-600">
                  {e}
                </h1>
              </li>
            ) : (
              <li>{e}</li>
            )}
          </ul>
        ))}
      </div>
    </div>
  )
}
