import { NavLink } from '@remix-run/react'
import type { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'

export function Layout(props: PropsWithChildren) {
  return (
    <div>
      <h1 className="font-medium leading-tight text-5xl mt-0 mb-2 text-blue-600">
        repco
      </h1>
      <Nav />
      <Outlet></Outlet>
    </div>
  )
}

export function Nav() {
  return (
    <ul className="flex border-b">
      <li className="-mb-px mr-1">
        <NavLink
          className={({ isActive }) =>
            isActive
              ? 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-700 font-semibold'
              : 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-200 font-semibold'
          }
          to="/items"
        >
          Items
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            isActive
              ? 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-700 font-semibold'
              : 'bg-white inline-block border-l border-t border-r rounded-t py-2 px-4 text-blue-200 font-semibold'
          }
          to="/Playlists"
        >
          Playlists
        </NavLink>
      </li>
    </ul>
  )
}
