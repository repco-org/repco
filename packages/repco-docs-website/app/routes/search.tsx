import type { LoaderFunction } from '@remix-run/node' // or cloudflare/deno
import { useLoaderData } from '@remix-run/react'
import { SearchForm, SearchResults } from '~/components/search';
import { searchDocs } from '~/lib/search.server'

export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  const query = url.searchParams.get("q")
  if (!query) return {}
  const results = await searchDocs(query)
  return { results }
}

export default function PageRoute() {
  const { results } = useLoaderData<typeof loader>()
  return (
    <div>
      <SearchForm />
      <SearchResults results={results} />
    </div>
  )
}

