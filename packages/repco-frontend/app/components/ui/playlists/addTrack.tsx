import * as Dialog from '@radix-ui/react-dialog'
import { PlusCircledIcon } from '@radix-ui/react-icons'
import { Form } from '@remix-run/react'
import { useState } from 'react'
import type { Playlist, Track } from '~/lib/usePlaylists'
import { usePlaylists } from '~/lib/usePlaylists'
import { Button, IconButton } from '../primitives/Button'

interface DialogProps {
  track: Track
}

export function PlaylistDialog(props: DialogProps) {
  const [playlist, setPlaylist] = useState<Playlist>()
  const { track } = props
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [playlists, createPlaylist, updatePlaylist, deletePlaylist] =
    usePlaylists()
  const [open, setOpen] = useState(false)
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <IconButton icon={<PlusCircledIcon />}>add to Playlist</IconButton>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-500 opacity-70" />
        <Dialog.Content className="fixed top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white rounded-lg shadow-2xl p-4 space-x-1 space-y-2">
          <Dialog.Title className="m-0 text-lg">Add to Playlist</Dialog.Title>
          <Form className="spacing-2">
            {playlists && playlists.length > 0 ? (
              <select
                className="p-2 border-2 rounded-md w-full bg-white"
                onFocus={(e) =>
                  setPlaylist(playlists[Number(e.currentTarget.value)])
                }
                placeholder="choose Playlist"
                onChange={(e) =>
                  setPlaylist(playlists[Number(e.currentTarget.value)])
                }
              >
                {playlists.map((playlist, index) => (
                  <option key={playlist.id} value={index}>
                    {playlist.id}
                  </option>
                ))}
              </select>
            ) : (
              <div>there is currently no playlist available</div>
            )}
          </Form>
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
            <Button className={'text-red-600'} aria-label="Close">
              Close
            </Button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
