import { LoaderFunction } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { usePlaylists } from '~/lib/usePlaylists'

export const loader: LoaderFunction = async ({ params }) => {
  return { id: params.id }
}

export default function Playlist() {
  const { id } = useLoaderData()
  const [playlists, getPlaylist] = usePlaylists()
  const [addTrack, removeTrack, tracks] = getPlaylist(id)
  return (
    <main className="px-2">
      <h2>{id}</h2>
      {tracks ? (
        tracks.map((t, i) => <div key={i}>{t.title}</div>)
      ) : (
        <div>loading...</div>
      )}
      <button onClick={() => addTrack('track1', 'bla')}>add track</button>
    </main>
  )
}
