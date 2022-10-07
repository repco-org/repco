import type { FC } from 'react'

interface ItemProps {
  children: React.ReactNode
  hellip?: boolean
}

/**
 * Each item display on the pagination uses this component as a wrapper
 */
export const Item: FC<ItemProps> = ({ children, hellip = false }) => {
  return (
    <li className="remix-pagination__item" data-hellip={hellip ? 'yes' : 'no'}>
      {children}
    </li>
  )
}
