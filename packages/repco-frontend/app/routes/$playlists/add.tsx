import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, Link, useActionData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { NavButton } from '~/components/ui/primitives/Button'
import { addToLocalStorageArray, localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = async ({ request }) => {
  //TODO: query from repco db playlists
  return null
}

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData()
  const data = formData.get('add-item') || ''

  const add = formData.get('add-to-playlist') || ''

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
    <main className="px-2">
      {added ? (
        <div>
          <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-green-600">
            Success <br /> {playlistAndUid}
          </h1>
          <p>
            {' '}
            <NavButton to={`/items`}>Return to Items</NavButton>
          </p>
        </div>
      ) : added || playlists.length !== 0 ? (
        <div>
          <h5 className="font-medium leading-tight text-xl mt-0 mb-2 text-blue-600">
            add ContenItem {uid} to:
          </h5>
          {playlists.map((e: any) => (
            <Form className="card" key={e} method="post">
              <p>
                <button
                  className="text-sm"
                  value={[e, uid]}
                  name="add-to-playlist"
                >
                  {e}
                </button>
              </p>
            </Form>
          ))}
        </div>
      ) : (
        <div className="px-6 py-6">
          <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
            <Link to={'/playlists'}>Create at least one Playlist</Link>
          </h1>
        </div>
      )}
    </main>
  )
}
