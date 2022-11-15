import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { Form, NavLink, useActionData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { Button } from '~/components/ui/primitives/Button'
import { Input } from '~/components/ui/primitives/Input'
import { addToLocalStorageArray, localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = ({ request }) => {
  // TODO: query playlists from repco db
  const data = ''
  return data
}

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

export default function Playlists() {
  const [showData, setShowData] = useState(true)
  const data = useActionData()
  const [playlists, setPlaylists] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      addToLocalStorageArray('playlists', data)
      setPlaylists(localStorageItemToArray('playlists'))
    }
  }, [data])
  useEffect(() => {
    if (!showData) return
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
      setShowData(false)
    }
  }, [showData])
  return (
    <main className="px-2">
      <Form method="post" action="/playlists">
        <div className="py-2 flex">
          <Input
            type="text"
            name="create-playlist"
            id="create-playlist"
            placeholder="add a new playlist..."
            variantSize="sm"
          />
          <Button>create new playlist</Button>
        </div>
      </Form>
      <div className="px-2 ">
        {playlists.length !== 0 ? (
          playlists.map((e: any) => (
            <div key={e} className="card">
              <NavLink
                className="text-sm"
                prefetch="render"
                to={`/playlists/playlist/${e}`}
              >
                {e}
              </NavLink>
            </div>
          ))
        ) : (
          <div className="px-2 ">
            <h1 className="font-medium leading-tight text-2xl mt-0 mb-2 text-red-600">
              Create at least one Playlist
            </h1>
          </div>
        )}
      </div>
    </main>
  )
}
