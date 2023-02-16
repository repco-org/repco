import Player from '~/components/player/Player'
import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { NavBar } from '@ui/bars/NavBar'
import { Logo } from '@ui/primitives/logo'
import { Outlet } from 'react-router-dom'
import { QueueView } from '~/components/player/Queue'
import { GitHubLoginButton } from '~/routes/__layout/login'
import { authenticator } from '~/services/auth.server'
import { LogoutButton } from './logout'

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request)
  return { user }
}

export default function Layout() {
  const { user } = useLoaderData()

  return (
    <div className="flex-col flex-1 space-y-4 h-screen">
      <header className="w-full flex justify-center bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="flex justify-between container">
          <div className="flex flex-col justify-start space-y-4">
            <Logo />
            <NavBar />
          </div>
          <div className="py-4">
            {user ? <LogoutButton /> : <GitHubLoginButton />}
          </div>
        </div>
      </header>
      <div className="flex justify-center min-h-full ">
        <div className="container min-h-full">
          <Outlet />
        </div>
      </div>
      <div
        className={
          'sticky bottom-0 w-full -z--1 flex-col justify-center bg-sky-500'
        }
      >
        <div className="bg-slate-200 overflow-y-auto  flex justify-center">
          <QueueView />
        </div>
        <div className="bg-sky-500 flex  justify-center">
          <Player />
        </div>
      </div>
    </div>
  )
}
