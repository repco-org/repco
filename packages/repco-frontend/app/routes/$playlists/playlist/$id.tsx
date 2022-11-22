import type { LoaderFunction } from '@remix-run/node'
import { Link, NavLink, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { getStorage } from '~/lib/helpers'

export const loader: LoaderFunction = ({ params }) => {
  const playlist = params
  return playlist
}

export default function Playlist() {
  const data = useLoaderData()
  console.log(data)
  const [playlists, setPlaylists] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPlaylists(getStorage(data.id))
    }
  }, [data])

  console.log(data)
  return (
    <main className="px-2">
      <h5 className="py-2 font-medium leading-tight text-xl mt-0 mb-2 text-blue-600">
        {data.id}
      </h5>
      {playlists.length > 0 ? (
        playlists.map((e: string, index: number) => (
          <ul key={index}>
            <NavLink
              className="text-sm"
              prefetch="render"
              to={`/items/item/${e}`}
            >
              {e}
            </NavLink>
          </ul>
        ))
      ) : (
        <h1 className="font-medium leading-tight text-2xl mt-2 mb-2 text-red-600">
          <Link to="/items">No items - go and add some :P</Link>
        </h1>
      )}
    </main>
  )
}
