import { ArrowLeftIcon } from '@radix-ui/react-icons'
import type { LoaderFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { usePlaylists } from '~/components/player/usePlaylists'
import { Button } from '~/components/ui/primitives/Button'

export const loader: LoaderFunction = async ({ params }) => {
  return { id: params.id }
}

export default function Playlist() {
  const { id } = useLoaderData()
  const { playlists, usePlaylist } = usePlaylists()
  const { addTrack, tracks, removeTrack } = usePlaylist(id)
  return (
    <main className="px-2">
      <Link to="/playlists">
        <ArrowLeftIcon />
      </Link>
      <h2 className="text-xl border-b-2">{id}</h2>
      <div className="pt-4">
        {tracks ? (
          tracks.map((t, i) => (
            <div
              className="p-2 flex  border-b-2 items-center justify-between space-x-1"
              key={i}
            >
              <Link to={'/items/' + t.uid}>
                <div className=" text-lg flex items-center space-x-3">
                  <span>{i + 1}</span>
                  <h3>{t.title}</h3>
                </div>
              </Link>
              <div className="flex justify-center items-center">
                <Button
                  onClick={(e) => {
                    removeTrack(t.uid)
                  }}
                >
                  delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div>loading...</div>
        )}
      </div>
    </main>
  )
}
