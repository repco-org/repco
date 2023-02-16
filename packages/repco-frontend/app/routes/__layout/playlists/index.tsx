import { PlayIcon } from '@radix-ui/react-icons'
import type { LoaderFunction } from '@remix-run/node'
import { NavLink } from '@remix-run/react'
import { Button } from '@ui/primitives/Button'
import { usePlaylists } from '~/components/player/usePlaylists'
import { useQueue } from '~/lib/usePlayQueue'

export const loader: LoaderFunction = async ({ request }) => {
  return { status: 200 }
}

export default function PlaylistIndex() {
  const { playlists, deletePlaylist } = usePlaylists()
  const { loadPlaylistToQueue } = useQueue()
  if (!playlists) return <div>loading...</div>

  return (
    <main className="px-2">
      <div className="px-2 space-y-2 w-full">
        {playlists.length !== 0 ? (
          playlists.map((p) => (
            <div
              key={p.id}
              className="w-full items-center align-middle justify-between flex border-b-2 pb-2"
            >
              <NavLink
                className="text-lg font-medium leading-tight text-gray-900"
                to={`/playlists/${p.id}`}
              >
                {p.id}{' '}
                <span className="text-xs">
                  ({p.tracks.length}
                  {p.tracks.length < 2 ? ' item' : ' items'})
                </span>
                {p.description}{' '}
              </NavLink>
              <div className="flex items-center align-middle space-x-1">
                <Button
                  variantSize={'sm'}
                  onClick={() => loadPlaylistToQueue(p)}
                >
                  <PlayIcon />
                </Button>
                <Button
                  intent="danger"
                  variantSize={'sm'}
                  onClick={() => deletePlaylist(p.id)}
                >
                  delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="px-2 ">
            Ohh, right now there is no playlist, if you want to create one there
            is a form in the left sidebar.
          </div>
        )}
      </div>
    </main>
  )
}
