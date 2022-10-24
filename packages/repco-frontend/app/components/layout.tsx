import { NavLink } from '@remix-run/react'
import type { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'

export function Layout(props: PropsWithChildren) {
  return (
    <div>
      <div className="flex justify-between">
        <h1 className="mb-4 text-3xl font-extrabold text-gray-900 dark:text-white md:text-5xl lg:text-6xl">
          <span className="text-transparent bg-clip-text bg-gradient-to-r to-blue-400 from-blue-800">
            REPCO
          </span>
        </h1>

        <button className="button" name="signIn">
          sign in
        </button>
      </div>
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
          className={({ isActive }) => (isActive ? 'navActive' : 'navInactive')}
          to="/items"
        >
          Items
        </NavLink>
        <NavLink
          className={({ isActive }) => (isActive ? 'navActive' : 'navInactive')}
          to="/Playlists"
        >
          Playlists
        </NavLink>
      </li>
    </ul>
  )
}
