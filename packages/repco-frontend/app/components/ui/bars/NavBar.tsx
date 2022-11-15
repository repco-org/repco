import { NavLink } from 'react-router-dom'

const active =
  'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 font-semibold text-purple-500'
const inactive =
  'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 font-semibold text-blue-200'

export function NavBar() {
  return (
    <ul className="flex border-b">
      <li className="-mb-px mr-1">
        <NavLink
          className={({ isActive }) => (isActive ? active : inactive)}
          to="/items"
        >
          Items
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? active : inactive)}
          to="/Playlists"
        >
          Playlists
        </NavLink>
      </li>
    </ul>
  )
}
