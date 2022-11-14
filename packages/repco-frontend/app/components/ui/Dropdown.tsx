import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React from 'react'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { NavLink } from '@remix-run/react'
import { cva, cx, VariantProps } from 'class-variance-authority'
import { Button } from './Button'

const stylesDropdownMenu = cva('', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    size: {
      md: 'py-1 px-3 text-base ',
      sm: 'py-1 px-2 text-sm',
    },
    variant: {
      default: [
        'radix-side-top:animate-slide-up radix-side-bottom:animate-slide-down',
        'w-48 rounded-lg px-1.5 py-1 shadow-md md:w-56',
        'bg-white',
      ],
    },
    item: {
      default: [
        'flex-col cursor-default select-none items-center rounded-md px-2 py-2 text-sm outline-none',
        'text-gray-800 focus:bg-gray-50 dark:focus:bg-gray-900',
      ],

      bare: '',
    },
  },
  defaultVariants: {
    variant: 'default',
    item: 'default',
    size: 'sm',
  },
})

export interface DropdownMenuBaseProps
  extends VariantProps<typeof stylesDropdownMenu> {}

export type DropdownMenuProps = DropdownMenuBaseProps

export function DropdownMenuCards(props: DropdownMenuProps) {
  const className = cx(stylesDropdownMenu(props))

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button variantSize={'icon'}>
          <HamburgerMenuIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={className} align="end" sideOffset={5}>
          <DropdownMenu.Item className="block py-2 px-4 hover:bg-gray-100">
            <NavLink to="#">add to Playlist</NavLink>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            disabled={true}
            className="block py-2 px-4 text-gray-400 hover:bg-gray-100 pointer-events-none cursor-not-allowed"
          >
            <NavLink to="#">Transcription</NavLink>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={true}
            className="block py-2 px-4 text-gray-400 hover:bg-gray-100 pointer-events-none cursor-not-allowed"
          >
            <NavLink to="#">Translation</NavLink>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={true}
            className="block py-2 px-4 text-gray-400 hover:bg-gray-100 pointer-events-none cursor-not-allowed"
          >
            <NavLink to="#">get similar items</NavLink>
          </DropdownMenu.Item>
          <DropdownMenu.Item
            disabled={true}
            className="block py-2 px-4 text-gray-400 hover:bg-gray-100 pointer-events-none cursor-not-allowed"
          >
            <NavLink to="#">recommend/share</NavLink>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
