import type { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'
import { NavBar } from './ui/bars/NavBar'
import { Button } from './ui/primitives/Button'
import { Logo } from './ui/primitives/logo'

export function Layout(props: PropsWithChildren) {
  return (
    <div>
      <div className="flex justify-between">
        <Logo />
        <div>
          <Button disabled={true}>sign in</Button>
          <Button disabled={true}>sign up</Button>
        </div>
      </div>
      <NavBar />
      <Outlet />
    </div>
  )
}
