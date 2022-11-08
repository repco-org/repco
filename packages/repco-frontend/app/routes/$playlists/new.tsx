import type { ActionFunction } from '@remix-run/node'
import { Form, NavLink, useActionData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { addToLocalStorageArray, localStorageItemToArray } from '~/lib/helpers'

//TODO mutation query to repco db, some better ui maybe with sorting
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
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
        {playlists.map((e: string, index: number) => (
          <div key={e}>
            {playlists.length === index + 1 ? (
              <div key={e} className="card">
                <NavLink
                  className=" text-sm px-0 py-4 font-light text-green-600 dark:text-green-500 hover:underline"
                  prefetch="render"
                  to={`/playlists/playlist/${e}`}
                >
                  {e}
                </NavLink>
              </div>
            ) : (
              <div key={e} className="card">
                <NavLink
                  className="link"
                  prefetch="render"
                  to={`/playlists/playlist/${e}`}
                >
                  {e}
                </NavLink>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
