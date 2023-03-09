import FilterByRepository from '~/components/sidebar/filterByRepositories'
import Search from '~/components/sidebar/search'
import SortBy from '~/components/sidebar/sortBy'
import { SwitchIcon } from '@radix-ui/react-icons'
import type { LoaderFunction } from '@remix-run/node'
import {
  Form,
  Outlet,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from '@remix-run/react'
import { useState } from 'react'
import { Button, IconButton } from '~/components/primitives/button'
import { ReposQuery } from '~/graphql/queries/repos'
import type { LoadReposQuery } from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadReposQuery>(ReposQuery, undefined)
  return data?.repos?.nodes || null
}

export default function ItemsMenuWrapper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const repositories = useLoaderData()
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const submit = useSubmit()

  return (
    <div>
      <div className="block px-4 lg:hidden">
        <IconButton
          icon={<SwitchIcon />}
          onClick={toggleSidebar}
          tooltip={sidebarOpen ? 'hide filters' : 'show filters'}
        />
      </div>
      <div className={'flex flex-col lg:flex-row'}>
        {sidebarOpen && (
          <div
            className={'flex flex-col px-4 py-8 overflow-y-auto lg:border-r'}
          >
            <div className="flex flex-col justify-between lg:mt-6 ">
              <aside>
                <Form
                  action={'.'}
                  method="get"
                  onChange={(e) => submit(e.currentTarget)}
                  className="space-y-2"
                  aria-label="Filter Form"
                >
                  <Search
                    searchParams={searchParams}
                    aria-label="Search Input"
                  />
                  <FilterByRepository
                    searchParams={searchParams}
                    repositories={repositories}
                    aria-label="Filter by Repository Select"
                  />
                  <SortBy aria-label="Sort By Select" />
                  <Button
                    type="button"
                    onClick={() => {
                      setSearchParams({
                        q: '',
                        type: 'title',
                        repoDid: 'all',
                        orderBy: 'PUB_DATE_DESC',
                      })
                    }}
                    className="text-white font-bold bg-brand-primary w-full py-2 px-4  hover:bg-brand-secondary focus:outline-none focus:ring-2 "
                    aria-label="Reset Button"
                  >
                    Reset
                  </Button>
                </Form>
              </aside>
            </div>
          </div>
        )}
        <main
          className={`flex-1 h-full lg:p-4 lg:m-8 overflow-y-auto ${
            sidebarOpen ? '' : 'w-auto'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
