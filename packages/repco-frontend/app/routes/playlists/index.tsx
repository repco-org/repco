import type { LoaderFunction } from '@remix-run/node'
import { NavLink } from '@remix-run/react'
import { IconButton } from '~/components/ui/primitives/Button'
import { usePlaylists } from '~/lib/usePlaylists'

export const loader: LoaderFunction = async () => {
  return { status: 200 }
}

export default function PlaylistIndex() {
  const [
    playlists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  ] = usePlaylists()

  if (!playlists) return <div>loading...</div>

  return (
    <main className="px-2">
      <div className="px-2 ">
        {playlists.length !== 0 ? (
          playlists.map((p) => (
            <div key={p.id} className="card">
              <NavLink
                className="text-lg font-medium leading-tight text-gray-900"
                prefetch="render"
                to={`/playlists/${p.id}`}
              >
                {p.id} ({p.tracks.length}){p.description}{' '}
              </NavLink>
              <IconButton onClick={() => deletePlaylist(p.id)}>
                delete
              </IconButton>
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
