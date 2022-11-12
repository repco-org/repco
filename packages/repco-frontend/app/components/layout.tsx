import type { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'
import { Button } from './ui/Button'
import { Logo } from './ui/logo'
import { Nav } from './ui/Nav'

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
      <Nav />
      <Outlet />
    </div>
  )
}
