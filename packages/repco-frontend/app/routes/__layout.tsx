import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { Outlet } from 'react-router-dom'
import { NavBar } from '~/components/ui/bars/NavBar'
import { Logo } from '~/components/ui/primitives/logo'
import { GitHubLoginButton } from '~/routes/login'
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
      <div className="flex justify-between">
        <Logo />
        <div className="p-4">
          {user ? <LogoutButton /> : <GitHubLoginButton />}
        </div>
      </div>
      <NavBar />
      <Outlet />
    </div>
  )
}
