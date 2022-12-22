import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { NavBar } from '@ui/bars/NavBar'
import { Logo } from '@ui/primitives/logo'
import { Outlet } from 'react-router-dom'
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
    <div className="min-h-full">
      <div className="bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="flex justify-between p-4 ">
          <Logo />
          <div className="p-4">
            {user ? <LogoutButton /> : <GitHubLoginButton />}
          </div>
        </div>
        <NavBar />
      </div>
      <Outlet />
    </div>
  )
}
