import { ListBulletIcon } from '@radix-ui/react-icons'
import { Outlet } from '@remix-run/react'
import { useState } from 'react'
import { usePlaylists } from '~/components/player/use-playlists'
import { Button } from '~/components/primitives/button'
import { InputWithIcon } from '~/components/primitives/input'

export default function ItemsMenuWrapper() {
  const [name, setName] = useState<string>()

  const { createPlaylist, error } = usePlaylists()

  return (
    <div className="flex h-full">
      <div className="flex flex-col p-4 border-r w-80 ">
        <div className="flex flex-col justify-between mt-6 ">
          <aside>
            <form className="inline">
              <div className=" justify-center space-y-2">
                {error && (
                  <div className="bg-red-500 align-middle flex justify-center text-white p-2">
                    {error}
                  </div>
                )}
                <InputWithIcon
                  name="createPlaylist"
                  id="createPlaylist"
                  type="text"
                  autoFocus
                  icon={<ListBulletIcon />}
                  placeholder="createPlaylist.."
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
                >
                  save
                </Button>
                <Button name="createPlaylist" fullWidth disabled={true}>
                  share playlist
                </Button>
              </div>
            </form>
          </aside>
        </div>
      </div>
      <main className="w-full h-full p-4 m-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
