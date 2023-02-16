import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { HamburgerMenuIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Track } from '~/components/player/usePlaylists'
import { Button, IconButton } from '~/components/ui/primitives/Button'
import { useQueue } from '~/lib/usePlayQueue'
import { PlaylistDialog } from './addTrackToPlaylistDialog'

export const TrackDropdown = ({ track }: { track: Track }) => {
  const { addTrack, tracks } = useQueue()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button aria-label="Customise options">
          <HamburgerMenuIcon />{' '}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className=" bg-slate-200 flex flex-col space-y-1 text-white p-4 shadow-md"
          sideOffset={5}
        >
          <DropdownMenu.Arrow className=" fill-slate-200" />

          <IconButton
            onClick={() => {
              addTrack(track)
            }}
            disabled={
              track && !tracks.find((item) => item.uid === track.uid)
                ? false
                : true
            }
            variantSize={'sm'}
            icon={<PlusCircledIcon />}
          >
            add to queue
          </IconButton>

          <PlaylistDialog track={track} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
