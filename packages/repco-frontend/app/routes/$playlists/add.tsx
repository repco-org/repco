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
      {added ? (
        <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-green-600">
          Success <br /> {playlistAndUid}
        </h1>
      ) : added || playlists.length !== 0 ? (
        playlists.map((e: any) => (
          <Form className="card" key={e} method="post">
            <p>
              <NavLink
                className="link"
                prefetch="render"
                to={`/playlists/playlist/${e}`}
              >
                {e}
              </NavLink>
            </p>
            <button className="button" value={[e, uid]} name="add-to-playlist">
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
