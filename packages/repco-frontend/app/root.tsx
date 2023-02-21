import type { MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import styles from './styles/app.css'
import { PlayerProvider } from './components/player/player'
import type { Playlist, Track } from './components/player/use-playlists'
import { LocalstorageContexts } from './lib/localstorage-contexts'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}
export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'repco',
  viewport: 'width=device-width,initial-scale=1',
})

const contextManager = LocalstorageContexts.getInstance()
const PlaylistProvider = contextManager.addMapContext<Playlist>('playlists')
const QueueProvider = contextManager.addListContext<Track[]>('queue')
export default function App() {
  return (
    <html lang="en" className="h-screen">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="h-screen m-0 p-0">
        <PlaylistProvider>
          <QueueProvider>
            <PlayerProvider>
              <Outlet />
            </PlayerProvider>
          </QueueProvider>
        </PlaylistProvider>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
