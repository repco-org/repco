import Player, { usePlayer } from '~/components/player/Player'
import { PlayIcon, ReaderIcon } from '@radix-ui/react-icons'
import type { LoaderArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { NavBar } from '@ui/bars/NavBar'
import { Logo } from '@ui/primitives/logo'
import { Outlet } from 'react-router-dom'
import { Button } from '~/components/ui/primitives/Button'
import { GitHubLoginButton } from '~/routes/__layout/login'
import { authenticator } from '~/services/auth.server'
import { LogoutButton } from './logout'

export async function loader({ request }: LoaderArgs) {
  const user = await authenticator.isAuthenticated(request)
  return { user }
}

export default function Layout() {
  const { user } = useLoaderData()
  const player = usePlayer()

  return (
    <div className="flex-col flex-1 flex justify-center ">
      <header className=" w-full bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="flex justify-between  p-4 ">
          <Logo />
          <div className="p-4">
            {user ? <LogoutButton /> : <GitHubLoginButton />}
          </div>
        </div>
        <NavBar />
      </header>
      <div className="container">
        <Outlet />
      </div>
      <div className={'fixed bottom-0 w-full  -z--1 flex-col  bg-sky-500'}>
        <div
          className={
            player?.queueVisibility ? 'bg-brand-primary  py-8' : 'hidden'
          }
        >
          <ul className="truncate w-full">
            {player?.tracks.map((track, i) => {
              const style =
                player.track?.uid === track.uid
                  ? ' bg-white text-black flex items-center my-2'
                  : 'bg-brand-primary text-white flex items-center pl-4 my-2'
              return (
                <li key={i} className={style}>
                  {player.track?.uid === track.uid && <PlayIcon />}
                  <Button
                    onClick={() => player.setTrackIndex(i)}
                    className="p-2 text-sm truncate"
                  >
                    {track.title}
                  </Button>
                  <Button>
                    <Link to={'/items/' + track.contentItemUid}>
                      <ReaderIcon />
                    </Link>
                  </Button>
                </li>
              )
            })}
          </ul>
        </div>
        <Player />
      </div>
    </div>
  )
}
