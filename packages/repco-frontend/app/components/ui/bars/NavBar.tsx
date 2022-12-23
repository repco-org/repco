import { NavLink } from 'react-router-dom'

const active =
  'inline-block py-2 px-4 font-semibold bg-white text-brand-secondary'
const inactive =
  'inline-block hover:opacity-100 opacity-60 py-2 px-4 font-semibold bg-brand-secondary'

export function NavBar() {
  const links = [
    { label: 'home', to: '/' },
    { label: 'items', to: '/items' },
    { label: 'playlists', to: '/playlists' },
  ]
  return (
    <nav aria-label="main navigation">
      <ul className="flex text-white pl-4">
        {links.map((l, i) => (
          <li key={i}>
            <NavLink
              className={({ isActive }) => (isActive ? active : inactive)}
              to={l.to}
            >
              {l.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
