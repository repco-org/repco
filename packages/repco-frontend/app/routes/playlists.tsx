import { NewPlaylistBar } from '~/components/ui/bars/NewPlaylistBar'
import PlaylistIndex from './$playlists'

export default function Playlists() {
  return (
    <div>
      <NewPlaylistBar />

      <PlaylistIndex />
    </div>
  )
}
