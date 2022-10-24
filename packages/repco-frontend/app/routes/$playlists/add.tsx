import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, Link, NavLink, useActionData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { addToLocalStorageArray, localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = async ({ request }) => {
  //TODO: query from repco db playlists
  return null
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const data = formData.get('add-item') || ''

  const add = formData.get('add-to-playlist') || ''
  console.log('SOME', data, add)
  return json({ uid: data, playlistAndUid: add })
}

export default function Playlists() {
  const { uid, playlistAndUid } = useActionData()

  const [playlists, setPlaylists] = useState([])
  const [added, setadded] = useState(false)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
    }
  }, [uid, playlistAndUid])

  useEffect(() => {
    if (playlistAndUid) {
      const newPlaylist = [playlistAndUid.split(',')]
      addToLocalStorageArray(newPlaylist[0][0], newPlaylist[0][1])
      setPlaylists(localStorageItemToArray('playlists'))
      setadded(true)
    }
  }, [playlistAndUid, uid])

  return (
    <div className="px-6 py-6">
      {added && (
        <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-green-600">
          Success <br /> {playlistAndUid}
        </h1>
      )}
      {playlists.length !== 0 ? (
        playlists.map((e: any) => (
          <Form
            className="flex-col p-4 w-full justify-center text-center bg-white rounded-lg border shadow-md dark:bg-gray-800 dark:border-gray-700"
            key={e}
            method="post"
          >
            <p>
              <NavLink
                className=" text-sm px-0 py-4 font-light text-blue-600 dark:text-blue-500 hover:underline"
                prefetch="render"
                to={`/playlists/playlist/${e}`}
              >
                {e}
              </NavLink>
            </p>
            <button
              className=" text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              value={[e, uid]}
              name="add-to-playlist"
            >
              add to playlist
            </button>
          </Form>
        ))
      ) : (
        <div className="px-6 py-6">
          <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
            <Link to={'/playlists/new'}>Create at least one Playlist</Link>
          </h1>
        </div>
      )}
    </div>
  )
}
