import * as RadioGroup from '@radix-ui/react-radio-group'
import { useSearchParams } from '@remix-run/react'
import type { Repo } from '~/graphql/types.js'

interface FilterByRepositoryProps {
  searchParams: URLSearchParams
  repositories: Repo[]
}

export default function FilterByRepository({
  searchParams,
  repositories,
}: FilterByRepositoryProps) {
  const [, setSearchParams] = useSearchParams()
  const selectedRepo = searchParams.get('repoDid') || 'all'

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
          {repositories &&
            repositories.map((repo: Repo, i: number) => (
              <div key={repo.did || i} className="flex items-center space-x-2">
                <RadioGroup.Item
                  className="bg-brand-primary w-4 h-4 rounded-full"
                  value={repo.did}
                  id={i.toString()}
                  aria-label={repo.name || 'repo'}
                >
                  <RadioGroup.Indicator className="flex items-center justify-center w-full h-full relative after:block after:w-2 after:h-2 after:rounded-full after:bg-white" />
                </RadioGroup.Item>
                <label className="text-sm" htmlFor={i.toString()}>
                  {repo.name}
                </label>
              </div>
            ))}
        </RadioGroup.Root>
      </div>
    </div>
  )
}
