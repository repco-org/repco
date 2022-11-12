import type { PropsWithChildren } from 'react'
import { Outlet } from 'react-router-dom'
import { Logo } from './logo'
import { Button } from './ui/Button'
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
