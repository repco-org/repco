import type { LoaderArgs, LoaderFunction, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import { loadTree } from './lib/util.server'

import appStyles from './css/app.css'
import normalize from './css/normalize.css'
import { Layout } from './components/layout'

export function links() {
  return [
    { rel: 'stylesheet', href: normalize },
    { rel: 'stylesheet', href: appStyles },
  ]
}
export const meta: MetaFunction = () => ({
  charset: 'utf-8',
  title: 'repco',
  viewport: 'width=device-width,initial-scale=1',
})

export const loader: LoaderFunction = async () => {
  const index = await loadTree()
  return { index }
}

export default function App() {
  const { index } = useLoaderData<typeof loader>()
  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
      </head>
      <body className="min-h-full p-0">
        <Layout index={index}>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
