import { LoaderFunction } from '@remix-run/node'
import { NavLink, useLoaderData } from '@remix-run/react'
import { useEffect, useState } from 'react'
import { localStorageItemToArray } from '~/lib/helpers'

export const loader: LoaderFunction = ({ params }) => {
  const playlist = params
  return playlist
}

export default function Playlist() {
  const data = useLoaderData()
  const [playlists, setPlaylists] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray(data.id))
    }
  }, [data])

  console.log(data)
  return (
    <div className="px-6">
      {playlists.length > 0 ? (
        playlists.map((e: string, index: number) => (
          <li>
            <NavLink
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              className=" text-sm px-0 py-4 font-light text-blue-600 dark:text-blue-500 hover:underline"
              prefetch="render"
              to={`/items/item/${e}`}
            >
              {e}
            </NavLink>
          </li>
        ))
      ) : (
        <h1 className="font-medium leading-tight text-2xl mt-2 mb-2 text-red-600">
          No items - go and add some :P
        </h1>
      )}
    </div>
  )
}
