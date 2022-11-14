import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import React, { useEffect, useState } from 'react'
import { PlayIcon, PlusIcon, TriangleRightIcon } from '@radix-ui/react-icons'
import { localStorageItemToArray } from '~/lib/helpers'

interface Props {}

export function Collapsible(props: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [showData, setShowData] = useState(true)

  useEffect(() => {
    if (!showData) return
    if (typeof window !== 'undefined') {
      setPlaylists(localStorageItemToArray('playlists'))
      setShowData(false)
    }
  }, [showData])

  return (
    <CollapsiblePrimitive.Root open={isOpen} onOpenChange={setIsOpen}>
      <CollapsiblePrimitive.Trigger
        className={
          'py-1 px-2 text-sm border rounded-md items-center transition-colors duration-100 cursor-default disabled:opacity-50 text-blue-700 bg-white-700 hover:text-purple-500 placeholder:focus:ring-purple-500 focus:ring-2 focus:outline-none inline-flex'
        }
      >
        <div>add to Playlist</div>
        <TriangleRightIcon className="transform duration-300 ease-in-out group-radix-state-open:rotate-90" />
      </CollapsiblePrimitive.Trigger>
      <CollapsiblePrimitive.Content className="mt-4 flex flex-col space-y-4">
        {playlists.map((title, i) => (
          <div
            key={`collapsible-${title}-${i}`}
            className={
              'group ml-12 flex select-none items-center justify-between rounded-md px-4 py-2 text-left text-sm  bg-white text-gray-900 hover:bg-purple-400'
            }
          >
            {title}
            <div className="hidden items-center space-x-3 group-hover:flex">
              <PlusIcon className="cursor-pointer text-gray-800 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
              <PlayIcon className="cursor-pointer text-gray-800 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" />
            </div>
          </div>
        ))}
      </CollapsiblePrimitive.Content>
    </CollapsiblePrimitive.Root>
  )
}
