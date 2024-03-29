import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { HamburgerMenuIcon, PlusCircledIcon } from '@radix-ui/react-icons'
import { Button, ButtonWithIcon } from '~/components/primitives/button'
import { AddTrackDialog } from './add-track-dialog'
import type { Track } from './use-playlists'
import { useQueue } from './use-queue'

export const TrackDropdown = ({ track }: { track: Track }) => {
  const { addTrack, tracks } = useQueue()
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button aria-label="options">
          <HamburgerMenuIcon />{' '}
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className=" bg-slate-200 flex flex-col space-y-1 text-white p-4 shadow-md"
          sideOffset={5}
        >
          <DropdownMenu.Arrow className=" fill-slate-200" />

          <ButtonWithIcon
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
          </ButtonWithIcon>

          <AddTrackDialog track={track} />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
