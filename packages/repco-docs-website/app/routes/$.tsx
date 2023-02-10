import type { LoaderFunction } from '@remix-run/node' // or cloudflare/deno
import { useLoaderData } from '@remix-run/react'
import { Page } from '~/components/page'
import { loadSlug } from '~/lib/util.server'

export const loader: LoaderFunction = async ({ params }) => {
  const slug = params['*']
  if (!slug) throw new Response('Not found', { status: 404 })
  const page = await loadSlug(slug)
  return page
}

export default function PageRoute() {
  const { content, data } = useLoaderData<typeof loader>()
  return <Page content={content} data={data} />
}
