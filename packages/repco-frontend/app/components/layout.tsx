import type { PropsWithChildren } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export function Layout(props: PropsWithChildren) {
  return (
    <div>
      <Nav />
      <h1>repco</h1>
      <Outlet></Outlet>
    </div>
  )
}

export function Nav() {
  return (
    <nav>
      <NavLink to="/items">Items</NavLink>
    </nav>
  )
}
