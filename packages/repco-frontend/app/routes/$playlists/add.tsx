import { ActionFunction, json, LoaderFunction } from '@remix-run/node'
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
      {playlists.length !== 0 ? (
        playlists.map((e: any) => (
          <Form key={e} method="post">
            <li className="font-medium">
              <NavLink
                className=" text-sm px-0 py-4 font-light text-blue-600 dark:text-blue-500 hover:underline"
                prefetch="render"
                to={`/playlists/playlist/${e}`}
              >
                {e}
              </NavLink>
              <button
                className="inline-flex items-center justify-center w-6 h-6 ml-2 text-white transition-colors duration-150 bg-blue-700 rounded-lg focus:shadow-outline hover:bg-blue-800"
                value={[e, uid]}
                name="add-to-playlist"
                type="submit"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                    clip-rule="evenodd"
                    fill-rule="evenodd"
                  ></path>
                </svg>
              </button>
            </li>
          </Form>
        ))
      ) : (
        <div className="px-6 py-6">
          <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
            <Link to={'/playlists/new'}>Create at least one Playlist</Link>
          </h1>
        </div>
      )}
      {added && (
        <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-green-600">
          Success <br /> {playlistAndUid}
        </h1>
      )}
    </div>
  )
}
