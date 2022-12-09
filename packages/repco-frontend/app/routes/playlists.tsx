import {
  ArrowDownIcon,
  ArrowUpIcon,
  ListBulletIcon,
} from '@radix-ui/react-icons'
import { Outlet, useSearchParams, useSubmit } from '@remix-run/react'
import { useState } from 'react'
import { Button, IconButton } from '~/components/ui/primitives/Button'
import { InputWithIcon } from '~/components/ui/primitives/Input'
import { usePlaylists } from '~/lib/usePlaylists'

export default function ItemsMenuWrapper() {
  const [searchParams] = useSearchParams()
  const orderBy = searchParams.get('orderBy')
  const [name, setName] = useState<string>()
  const submit = useSubmit()
  const [
    playlists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
  ] = usePlaylists()

  return (
    <div className="flex">
      <div className="flex flex-col px-4 py-8 overflow-y-auto border-r w-80 ">
        <div className="flex flex-col justify-between mt-6 ">
          <aside>
            <form className="inline">
              <div className=" justify-center mt-4 flex ">
                <InputWithIcon
                  name="createPlaylist"
                  id="createPlaylist"
                  type="text"
                  autoFocus
                  placeholder="createPlaylist.."
                  icon={<ListBulletIcon />}
                  onChange={(e) => {
                    e.preventDefault()
                    setName(e.currentTarget.value)
                  }}
                />
                <Button
                  name="createPlaylist"
                  variant="default"
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
              </div>
              <h2 className="text-lg pt-2 w-full border-b-2 border-gray-200">
                {' '}
                Sort by{' '}
              </h2>
              <div>
                {orderBy === 'TITLE_DESC' ? (
                  <IconButton
                    type="submit"
                    name="orderBy"
                    value="TITLE_ASC"
                    className="text-blue-500"
                    icon={<ArrowDownIcon />}
                  >
                    Title (Z-A)
                  </IconButton>
                ) : (
                  <IconButton
                    type="submit"
                    name="orderBy"
                    value="TITLE_DESC"
                    className="text-blue-500"
                    icon={<ArrowUpIcon />}
                  >
                    Title (A-Z)
                  </IconButton>
                )}
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
