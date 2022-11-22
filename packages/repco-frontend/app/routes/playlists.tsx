import { Outlet } from '@remix-run/react'
import { NewPlaylistBar } from '~/components/ui/bars/NewPlaylistBar'

export default function Playlists() {
  return (
    <div>
      <NewPlaylistBar />

      <Outlet />
    </div>
  )
}
