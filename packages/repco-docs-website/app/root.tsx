import type { LoaderFunction, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'
import tailwindStyles from './styles/app.css'
import { Layout } from './components/layout'
import {
  Theme,
  ThemeBody,
  ThemeHead,
  ThemeProvider,
  useTheme,
} from './lib/theme-provider'
import { getThemeSession } from './lib/theme.server'
import { loadTree } from './lib/util.server'

export function links() {
  return [{ rel: 'stylesheet', href: tailwindStyles }]
}

export const meta: MetaFunction = ({ data }) => {
  const requestInfo = data?.requestInfo
  const title = 'Repco Docs'
  const description = 'Replication & Collector'
  return {
    viewport: 'width=device-width,initial-scale=1,viewport-fit=cover',
    'theme-color': requestInfo?.session.theme === 'dark' ? '#1F2028' : '#FFF',
    keywords:
      'infrastructure, metadata, collector, replication, community media, repco, ECB, arso, cba ',
    title,
    description,
  }
}

export type LoaderData = {
  index: any
  themeData: Theme | null
}
export const loader: LoaderFunction = async ({ request }) => {
  const index = await loadTree()
  const themeSession = await getThemeSession(request)

  return { index, themeData: themeSession.getTheme() }
}

export function App() {
  const { index, themeData } = useLoaderData<LoaderData>()
  const [theme] = useTheme()

  return (
    <html lang="en" className={theme ?? ''}>
      <head>
        <Meta />
        <Links />
        <ThemeHead ssrTheme={Boolean(themeData)} />
      </head>
      <body className="min-h-full p-0">
        <Layout index={index}>
          <Outlet />
          <ThemeBody ssrTheme={Boolean(themeData)} />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
export default function AppWithProviders() {
  const { themeData } = useLoaderData<LoaderData>()

  return (
    <ThemeProvider specifiedTheme={themeData}>
      <App />
    </ThemeProvider>
  )
}
