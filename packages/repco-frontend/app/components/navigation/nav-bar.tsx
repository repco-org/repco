import { NavLink } from '@remix-run/react'
import { useState } from 'react'
import { MenuCloseIcon, MenuIcon } from '../icons'

const active = 'block py-2 px-4 font-semibold bg-white text-brand-secondary'
const inactive =
  'block hover:opacity-100 opacity-60 py-2 px-4 font-semibold bg-brand-secondary text-white'

export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const links = [
    { label: 'Dashboard', to: '/' },
    { label: 'Items', to: '/items' },
    { label: 'Playlists', to: '/playlists' },
  ]

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <nav aria-label="main navigation" role="navigation">
      <div className="flex justify-between items-center px-1 sm:px-0">
        <div className="sm:hidden">
          <button
            onClick={handleMenuToggle}
            type="button"
            className="text-white hover:text-gray-300 focus:text-gray-300 focus:outline-none ml-0"
            aria-expanded={isMenuOpen}
            aria-controls="menu-list"
            title={isMenuOpen ? 'Close menu' : 'Open menu'}
            tabIndex={parseInt('0')}
          >
            {isMenuOpen ? <MenuCloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>
      <ul
        id="menu-list"
        className={`${
          isMenuOpen ? 'block' : 'hidden'
        }  sm:flex text-white space-y-2 sm:space-y-0 sm:space-x-1`}
      >
        {links.map((l, i) => (
          <li key={i}>
            <NavLink
              to={l.to}
              className={({ isActive }) =>
                isActive ? `${active} text-gray-900` : inactive
              }
              title={l.label}
              aria-label={`${l.label} navigation link`}
              onClick={handleMenuToggle}
              aria-current={active ? 'page' : undefined}
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
