import { LoaderFunction } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = ({ request }) => {
  // TODO: query playlists from repco db
  const data = ''
  return data
}

export default function Playlists() {
  const data = useLoaderData()
  const [playlists, setPlaylists] = useState([])
  const [showData, setShowData] = useState(true)
  useEffect(() => {
    if (!showData) return
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
      setShowData(false)
    }
  })
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
      <div className="px-6 py-6">
        {playlists.length !== 0 ? (
          playlists.map((e: any) => (
            <li key={e} className="font-medium">
              {<Link to={`/playlists/playlist/${e}`}>{e}</Link>}
            </li>
          ))
        ) : (
          <div className="px-6 py-6">
            <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
              Create at least one Playlist
            </h1>
          </div>
        )}
      </div>
    </div>
  )
}
