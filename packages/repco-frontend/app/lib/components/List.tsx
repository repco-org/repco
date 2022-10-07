import type { FC } from 'react'

interface ListProps {
  children: React.ReactNode
}

/**
 * This component is used to display a list of unordered elements
 */
export const List: FC<ListProps> = ({ children }) => {
  return <ul className="remix-pagination__list">{children}</ul>
}
