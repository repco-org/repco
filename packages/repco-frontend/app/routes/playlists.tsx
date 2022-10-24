import type { LoaderFunction } from '@remix-run/node'
import { Form, NavLink } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = ({ request }) => {
  // TODO: query playlists from repco db
  const data = ''
  return data
}

export default function Playlists() {
  const [playlists, setPlaylists] = useState([])
  const [showData, setShowData] = useState(true)
  useEffect(() => {
    if (!showData) return
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
      setShowData(false)
    }
  }, [showData])
  return (
    <div>
      <Form method="post" action="/playlists/new">
        <div className="relative">
          <div className="inlineSvg">
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
            className="input"
            placeholder="add a new playlist..."
          />
          <button className="inlineBtn">create new playlist</button>
        </div>
      </Form>
      <div className="px-6 py-6">
        {playlists.length !== 0 ? (
          playlists.map((e: any) => (
            <div key={e} className="card">
              <NavLink
                className="link"
                prefetch="render"
                to={`/playlists/playlist/${e}`}
              >
                {e}
              </NavLink>
            </div>
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
