// FIXME: this should technically not be required
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import clsx from 'clsx'
import { Link as RemixLink } from '@remix-run/react'
import type { FC } from 'react'

interface LinkProps {
  children: React.ReactNode
  to: string
  label: string
  current?: boolean
  isIcon?: boolean
  disabled?: boolean
}

/**
 * This component is used to display anchor tags using the inbuilt Remix Link.
 */
export const Link: FC<LinkProps> = ({
  children,
  to,
  label,
  current,
  isIcon = false,
  disabled,
}) => {
  return (
    <RemixLink
      to={to}
      className={clsx(
        !isIcon ? 'remix-pagination__link' : 'remix-pagination__icon-link',
        current && 'remix-pagination__link--current',
        disabled && 'remix-pagination__link--disabled',
      )}
      style={{ pointerEvents: disabled ? 'none' : 'auto' }}
      aria-label={label}
      aria-current={current}
      aria-disabled={disabled}
    >
      {children}
    </RemixLink>
  )
}
