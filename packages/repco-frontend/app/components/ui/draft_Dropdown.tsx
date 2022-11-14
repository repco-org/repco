import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import React from 'react'
import { HamburgerMenuIcon } from '@radix-ui/react-icons'
import { cva, cx, VariantProps } from 'class-variance-authority'
import { Button, ButtonProps, NavButton, stylesBtn } from './Button'

const stylesDmc = cva('', {
  variants: {
    dmc_disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    dmc_size: {
      md: 'py-1 px-3 text-base ',
      sm: 'py-1 px-2 text-sm',
    },
    dmc_variant: {
      default: [
        'absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none',
      ],

      bare: '',
    },
  },
  defaultVariants: {
    dmc_variant: 'bare',
  },
})
const styles = ({
  dmc_disabled,
  dmc_size,

  dmc_variant,
  btn_variant,
  btn_size,
}: CardProps = {}) =>
  cx(
    stylesDmc({ dmc_disabled, dmc_variant, dmc_size }),
    stylesBtn({ btn_variant }),
  )
export interface CardBaseProps extends VariantProps<typeof stylesDmc> {}
export type CardProps = CardBaseProps &
  ButtonProps &
  DropdownMenu.DropdownMenuContentProps

export function DropdownMenuDemo(props: CardProps) {
  const className = cx(styles(props))

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger>
        <Button className={className}>
          <HamburgerMenuIcon />
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={className} sideOffset={5}>
          <DropdownMenu.Item className="DropdownMenuItem">
            <NavButton className={className} to="#">
              Test
            </NavButton>
          </DropdownMenu.Item>
          <DropdownMenu.Item className="DropdownMenuItem">
            New Window <div className="RightSlot">⌘+N</div>
          </DropdownMenu.Item>
          <DropdownMenu.Item className="DropdownMenuItem" disabled>
            New Private Window <div className="RightSlot">⇧+⌘+N</div>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}

export default DropdownMenuDemo
