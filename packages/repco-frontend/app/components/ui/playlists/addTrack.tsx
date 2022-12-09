import * as Dialog from '@radix-ui/react-dialog'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { Playlist, Track, usePlaylists } from '~/lib/usePlaylists'
import { Button, IconButton } from '../primitives/Button'

interface DialogProps {
  track: Track
}

export function PlaylistDialog(props: DialogProps) {
  const [playlist, setPlaylist] = useState<Playlist>()
  const { track } = props
  const [
    playlists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  ] = usePlaylists()
  const [addTrack, removeTrack, tracks] = getPlaylist(playlist?.id || '')
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <IconButton icon={<PlusCircledIcon />}>add to Playlist</IconButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-500 opacity-70" />
        <Dialog.Content className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-2xl p-4">
          <Dialog.Title className="m-0 text-lg">Add to Playlist</Dialog.Title>
          <form>
            <select
              onChange={(e) => {
                playlists
                  ? setPlaylist(playlists[Number(e.currentTarget.value)])
                  : undefined
                return
              }}
            >
              {playlists &&
                playlists.map((playlist, index) => (
                  <option key={playlist.id} value={index}>
                    {playlist.id}
                  </option>
                ))}
            </select>
          </form>
          <Dialog.Close asChild>
            <Button
              onClick={(e) => {
                e.preventDefault()
                if (playlist) {
                  updatePlaylist(playlist.id, {
                    ...playlist,
                    tracks: [
                      ...playlist.tracks,
                      {
                        title: track.title,
                        uid: track.uid,
                        description: track.description,
                      },
                    ],
                  })
                }
                setOpen(false)
              }}
            >
              Save
            </Button>
          </Dialog.Close>
          <Dialog.Close asChild>
            <button aria-label="Close">Close</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
