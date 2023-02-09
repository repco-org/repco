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
import { ContextManager } from './lib/contextManager'
import type { Playlist, Track } from './lib/usePlaylists'
import { PlayerProvider } from './components/player/Player'

export function links() {
  return [{ rel: 'stylesheet', href: styles }]
}
export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'repco',
  viewport: 'width=device-width,initial-scale=1',
})

const contextManager = ContextManager.getInstance()
const PlaylistProvider = contextManager.addMapContext<Playlist>('playlists')
const QueueProvider = contextManager.addListContext<Track[]>('queue')
export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="min-h-full p-0">
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
