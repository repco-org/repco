import { ActionFunction, json, LoaderFunction } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
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
              {e}
              <button
                className="text-white mx-6 my-2
                     bottom-1.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                value={[e, uid]}
                name="add-to-playlist"
                type="submit"
              >
                +
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
