import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
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
      {playlists.map((e: string, index: number) => (
        <ul>{playlists.length === index + 1 ? <li>{e}</li> : <li>{e}</li>}</ul>
      ))}
    </div>
  )
}
