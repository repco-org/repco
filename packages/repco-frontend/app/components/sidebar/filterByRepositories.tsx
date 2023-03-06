import * as RadioGroup from '@radix-ui/react-radio-group'
import type { LoaderFunction } from '@remix-run/node'
import { useLoaderData, useSearchParams } from '@remix-run/react'
import { ReposQuery } from '~/graphql/queries/repos'
import type { LoadReposQuery, Repo } from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

interface FilterByRepositoryProps {
  searchParams: URLSearchParams
}

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadReposQuery>(ReposQuery, undefined)
  return data?.repos
}

export default function FilterByRepository({
  searchParams,
}: FilterByRepositoryProps) {
  const [, setSearchParams] = useSearchParams()
  const selectedRepo = searchParams.get('repoDid') || 'all'
  const repos = useLoaderData<typeof loader>()

  const handleRepoDidChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams.toString())
    newSearchParams.set('repoDid', value)
    setSearchParams(newSearchParams)
  }

  return (
    <div>
      <h2
        id="filter-heading"
        className="text-lg pt-2 w-full border-b-2 border-gray-200"
      >
        Filter by Repositories
      </h2>
      <div className="flex items-center space-x-2">
        <RadioGroup.Root
          className="flex flex-col space-y-2 mt-4"
          value={selectedRepo}
          onValueChange={handleRepoDidChange}
          aria-labelledby="filter-heading"
          aria-describedby="filter-description"
          name="repoDid"
        >
          <div className="flex items-center space-x-2">
            <RadioGroup.Item
              className="bg-brand-primary w-4 h-4 rounded-full"
              value="all"
              id="all"
              aria-label="All repositories"
            >
              <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
            </RadioGroup.Item>
            <label className="text-sm" htmlFor="all">
              All
            </label>
          </div>
          {repos.nodes.map((repo: Repo, i: number) => (
            <div key={repo.did || i} className="flex items-center space-x-2">
              <RadioGroup.Item
                className="bg-brand-primary w-4 h-4 rounded-full"
                value={repo.did}
                id={repo.name || i.toString()}
              >
                <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
              </RadioGroup.Item>
              <label className="text-sm" htmlFor={repo.name || i.toString()}>
                {repo.name}
              </label>
            </div>
          ))}
        </RadioGroup.Root>
      </div>
    </div>
  )
}
