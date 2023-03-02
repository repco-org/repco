import Sidebar from '~/components/sidebar/sidebar'
import { ListBulletIcon } from '@radix-ui/react-icons'
import { useState } from 'react'
import { usePlaylists } from '~/components/player/use-playlists'
import { Button } from '~/components/primitives/button'
import { InputWithIcon } from '~/components/primitives/input'

export default function ItemsMenuWrapper() {
  const [name, setName] = useState<string>()

  const { createPlaylist, error } = usePlaylists()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const buttonText = sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'

  return (
    <div>
      <Button onClick={toggleSidebar} aria-label={buttonText}>
        {buttonText}
      </Button>
      <Sidebar
        sidebarWidth="w-60"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        aria-label="Filterable sidebar"
      >
        <form className="inline">
          <div className=" justify-center space-y-2">
            {error && (
              <div
                aria-live="assertive"
                className="bg-red-500 align-middle flex justify-center text-white p-2"
              >
                {error}
              </div>
            )}
            <InputWithIcon
              name="createPlaylist"
              id="createPlaylist"
              type="text"
              tooltip="Input for the Name"
              autoFocus
              icon={<ListBulletIcon />}
              placeholder="Create playlist.."
              aria-label="Playlist name"
              onChange={(e) => {
                e.preventDefault()
                setName(e.currentTarget.value)
              }}
            />
            <Button
              name="createPlaylist"
              fullWidth
              disabled={name && window !== undefined ? false : true}
              onClick={(e) => {
                e.preventDefault()
                createPlaylist(name)
                setName(undefined)
                e.currentTarget.form?.reset()
              }}
              aria-label="Save playlist"
            >
              save
            </Button>
            <Button
              name="createPlaylist"
              fullWidth
              disabled={true}
              aria-label="Share playlist"
            >
              share playlist
            </Button>
          </div>
        </form>
      </Sidebar>
    </div>
  )
}
