import * as RadioGroup from '@radix-ui/react-radio-group'
import Sidebar from '~/components/sidebar/sidebar'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons'
import type { LoaderFunction } from '@remix-run/node'
import {
  Form,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from '@remix-run/react'
import { useState } from 'react'
import { Button, IconButton } from '~/components/primitives/button'
import { InputWithIcon } from '~/components/primitives/input'
import { ReposQuery } from '~/graphql/queries/repos'
import type { LoadReposQuery, Repo } from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadReposQuery>(ReposQuery, undefined)
  return data?.repos
}

export default function ItemsMenuWrapper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const orderBy = searchParams.get('orderBy')
  const repoDid = searchParams.get('repoDid') || 'all'
  const repos = useLoaderData<typeof loader>()
  const handleRepoDidChange = (value: string) => {
    setSearchParams({ ...searchParams, repoDid: value })
  }
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const buttonText = sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [searchType, setSearchType] = useState(
    searchParams.get('type') || 'title',
  )
  const submit = useSubmit()

  const handleRadioChange = (value: string) => {
    setSearchType(value)
    submit
  }
  return (
    <div>
      <div className="block lg:hidden">
        <Button onClick={toggleSidebar} aria-label={buttonText}>
          {buttonText}
        </Button>
      </div>

      <Sidebar
        sidebarWidth="w-60"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        aria-label="filterable main"
      >
        <Form
          action={'.'}
          method="get"
          onChange={(e) => submit(e.currentTarget)}
          className="space-y-2"
        >
          <InputWithIcon
            name="q"
            id="q"
            type="text"
            autoFocus
            placeholder="Search"
            tooltip="Search Input"
            icon={<MagnifyingGlassIcon />}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search"
          />

          <h2 className="text-lg pt-2 w-full border-b-2 border-gray-200">
            Search by
          </h2>

          <div className="flex items-center space-x-2">
            <RadioGroup.Root
              className="flex flex-col space-y-2"
              value={searchType}
              onValueChange={handleRadioChange}
              aria-label="Search by"
              name="type"
            >
              <div className="flex items-center space-x-2">
                <RadioGroup.Item
                  className="bg-brand-primary w-4 h-4 rounded-full"
                  value="title"
                  id="title"
                >
                  <RadioGroup.Indicator
                    className="flex
                        items-center  justify-center w-full h-full relative
                        after:block   after:w-2 after:h-2 after:rounded-full after:bg-white"
                  />
                </RadioGroup.Item>
                <label className="text-sm" htmlFor="title">
                  Search by title
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroup.Item
                  className="bg-brand-primary w-4 h-4 rounded-full"
                  value="fulltext"
                  id="fulltext"
                >
                  <RadioGroup.Indicator
                    className="flex
                        items-center  justify-center w-full h-full relative
                        after:block   after:w-2 after:h-2 after:rounded-full after:bg-white"
                  />
                </RadioGroup.Item>
                <label className="text-sm" htmlFor="fulltext">
                  Search by full text
                </label>
              </div>
            </RadioGroup.Root>
          </div>
          <h2 className="text-lg pt-2 w-full border-b-2 border-gray-200">
            Filter by Repositorys
          </h2>
          <div className="flex items-center space-x-2">
            <RadioGroup.Root
              className="flex flex-col space-y-2"
              defaultValue={repoDid}
              aria-label="Filter by repository"
              name="repoDid"
            >
              <div className="flex items-center space-x-2">
                <RadioGroup.Item
                  className="bg-brand-primary w-4 h-4 rounded-full"
                  value="all"
                  id="all"
                  onChange={() => handleRepoDidChange('all')}
                  aria-label="All repositories"
                >
                  <RadioGroup.Indicator
                    className="flex
                        items-center  justify-center w-full h-full relative
                        after:block   after:w-2 after:h-2 after:rounded-full after:bg-white"
                  />
                </RadioGroup.Item>
                <label className="text-sm" htmlFor="all">
                  all
                </label>
              </div>
              {repos.nodes.map((repo: Repo, i: number) => (
                <div key={i} className="flex items-center space-x-2">
                  <RadioGroup.Item
                    className="bg-brand-primary w-4 h-4 rounded-full"
                    value={repo.did}
                    id={repo.name || i.toString()}
                  >
                    <RadioGroup.Indicator
                      className="flex
          items-center  justify-center w-full h-full relative
          after:block   after:w-2 after:h-2 after:rounded-full after:bg-white"
                    />
                  </RadioGroup.Item>
                  <label
                    className="text-sm"
                    htmlFor={repo.name || i.toString()}
                  >
                    {repo.name}
                  </label>
                </div>
              ))}{' '}
            </RadioGroup.Root>
          </div>
          <h2 className="text-lg pt-2 w-full border-b-2 border-gray-200">
            {' '}
            Sort by{' '}
          </h2>
          <div>
            {orderBy === 'TITLE_DESC' ? (
              <IconButton
                type="submit"
                name="orderBy"
                value="TITLE_ASC"
                className="text-brand-primary"
                icon={<ArrowDownIcon />}
              >
                Title (Z-A)
              </IconButton>
            ) : (
              <IconButton
                type="submit"
                name="orderBy"
                value="TITLE_DESC"
                className="text-brand-primary"
                icon={<ArrowUpIcon />}
              >
                Title (A-Z)
              </IconButton>
            )}
          </div>
          <Button
            type="button"
            onClick={() => {
              setSearchParams({
                q: '',
                type: 'title',
                repoDid: 'all',
                orderBy: 'TITLE_DESC',
              })
              setSearchInput('')
              setSearchType('title')
              handleRepoDidChange('all')
              document.getElementById('all')?.click()
            }}
            className="text-white font-bold bg-brand-primary w-full py-2 px-4  hover:bg-brand-secondary focus:outline-none focus:ring-2 "
          >
            Reset
          </Button>
        </Form>
      </Sidebar>
    </div>
  )
}
