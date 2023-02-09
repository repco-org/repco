import Player, { usePlayer } from '~/components/player/Player'
import type { LoaderArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { NavBar } from '@ui/bars/NavBar'
import { Logo } from '@ui/primitives/logo'
import { Outlet } from 'react-router-dom'
import { GitHubLoginButton } from '~/routes/__layout/login'
import { authenticator } from '~/services/auth.server'
import { LogoutButton } from './logout'
import { useQueue } from '~/lib/usePlayQueue'
import { DotIcon } from '@radix-ui/react-icons'

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request)
  return { user }
}

export default function Layout() {
  const { user } = useLoaderData()
  const player = usePlayer()
  return (
    <div className="min-h-full">
      <header className="bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="flex justify-between p-4 ">
          <Logo />
          <div className="p-4">
            {user ? <LogoutButton /> : <GitHubLoginButton />}
          </div>
        </div>
        <NavBar />
      </header>
      <div className="flex flex-col">
        <div className="bg-slate-400 sticky top-0 -z--1">
          <Player />
        </div>
        <div className='flex'>
        <div className=' w-2/3'>
        <Outlet />
        </div>
        <div className='bg-brand-primary w-1/3 py-8'>
          
          <ul className='w-full'>
          {player?.tracks.map((track, i) => {
           const style = (player.track?.uid === track.uid) ?
           "bg-black text-white flex items-center" :
           "bg-brand-secondary text-white pl-4" 
          return <li  key = {i} className={style}>
            {player.track?.uid === track.uid && <DotIcon/>}
            <p className='px-2 text-sm '>{track.title}</p></li>
          }
              
          )}
          </ul>
        </div>
        </div>
        
      </div>
    </div>
  )
}
