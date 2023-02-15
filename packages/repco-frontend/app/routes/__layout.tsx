import Player, { usePlayer } from '~/components/player/Player'
import {
  Cross1Icon,
  PlayIcon,
  PlusIcon,
  ReaderIcon,
} from '@radix-ui/react-icons'
import type { LoaderArgs } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { NavBar } from '@ui/bars/NavBar'
import { Logo } from '@ui/primitives/logo'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Button } from '~/components/ui/primitives/Button'
import { usePlaylists } from '~/lib/usePlaylists'
import { useQueue } from '~/lib/usePlayQueue'
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

const QueueView = () => {
  const player = usePlayer()
  const { createPlaylist, error } = usePlaylists()
  const { tracks } = useQueue()
  const [playlistName, setPlaylistName] = useState<string | null>(null)
  return (
    <div
      className={
        player?.queueVisibility ? 'max-h-83 container py-4 shadow-lg' : 'hidden'
      }
    >
      <div className="flex justify-between bg-slate-200 top-0 sticky py-4 border-b-2 border-b-brand-primary">
        <div className="flex space-x-2 items-end">
          {error && <p>{error}</p>}
          <div className="flex flex-col">
            <h5 className="text-sm text-brand-primary">create playlist</h5>
            <label className="text-xs" htmlFor="playlistName">
              Name
            </label>

            <input
              className="h-8"
              type="text"
              id="playlistName"
              onChange={(e) => {
                setPlaylistName(e.currentTarget.value)
              }}
            />
          </div>
          <Button
            disabled={playlistName ? false : true}
            placeholder="playlist name"
            onClick={() => {
              if (playlistName && playlistName.length > 0) {
                createPlaylist('Playlist', {
                  id: 'Playlist',
                  tracks: tracks,
                })
              }
            }}
          >
            <PlusIcon />
          </Button>
        </div>
        <Button onClick={() => player?.setQueueVisibility(false)}>
          <Cross1Icon />
        </Button>
      </div>
      <div className="overflow-auto max-h-56 z-50">
        <ul>
          {player?.tracks.map((track, i) => {
            const style =
              player.track?.uid === track.uid
                ? ' bg-white justify-between px-2 flex items-center my-2'
                : ' bg-slate-100 justify-between px-2 flex items-center my-2 pl-4'
            return (
              <li key={i} className={style}>
                <div className="flex items-center">
                  {player.track?.uid === track.uid && <PlayIcon />}
                  <Button
                    onClick={() => player.setTrackIndex(i)}
                    className="p-2 text-sm truncate"
                  >
                    {i + 1 + ' '}
                    {track.title}
                  </Button>
                </div>
                <Button intent={'primary'}>
                  <Link to={'/items/' + track.contentItemUid}>
                    <ReaderIcon />
                  </Link>
                </Button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
