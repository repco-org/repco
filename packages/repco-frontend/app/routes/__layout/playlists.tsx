import { ListBulletIcon } from '@radix-ui/react-icons'
import { Outlet, useSearchParams } from '@remix-run/react'
import { useState } from 'react'
import { Button } from '~/components/ui/primitives/Button'
import { InputWithIcon } from '~/components/ui/primitives/Input'
import { usePlaylists } from '~/lib/usePlaylists'

export default function ItemsMenuWrapper() {
  const [searchParams] = useSearchParams()
  const orderBy = searchParams.get('orderBy')
  const [name, setName] = useState<string>()

  const [
    playlists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    error,
  ] = usePlaylists()

  return (
    <div className="flex h-full">
      <div className="flex flex-col p-4 overflow-y-auto border-r w-80 ">
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
      <div className="w-full h-full p-4 m-8 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
