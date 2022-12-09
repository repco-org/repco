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
import { Layout } from './components/layout.js'
import { ContextManager } from './lib/contextManager'
import { Playlist } from './lib/usePlaylists'

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

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <PlaylistProvider>
          <Layout>
            <Outlet />
          </Layout>
        </PlaylistProvider>

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
