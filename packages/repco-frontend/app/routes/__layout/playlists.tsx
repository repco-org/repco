import { ListBulletIcon } from '@radix-ui/react-icons'
import { Outlet } from '@remix-run/react'
import { useState } from 'react'
import { usePlaylists } from '~/components/player/use-playlists'
import { Button, IconButton } from '~/components/primitives/button'
import { InputWithIcon } from '~/components/primitives/input'

export default function ItemsMenuWrapper() {
  const [name, setName] = useState<string>()

  const { createPlaylist, error } = usePlaylists()

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div>
      <div className="block px-4 lg:hidden">
        <IconButton
          icon={<ListBulletIcon />}
          onClick={toggleSidebar}
          tooltip={sidebarOpen ? 'hide menu' : 'show menu'}
        />
      </div>
      <div className={'flex flex-col lg:flex-row'}>
        {sidebarOpen && (
          <div
            className={'flex flex-col px-4 py-8 overflow-y-auto lg:border-r'}
          >
            <div className="flex flex-col justify-between lg:mt-6 ">
              <aside>
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
              </aside>
            </div>
          </div>
        )}
        <main
          className={`flex-1 h-full lg:p-4 lg:m-8 overflow-y-auto ${
            sidebarOpen ? '' : 'w-auto'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
