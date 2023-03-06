import FilterByRepository from '~/components/sidebar/filterByRepositories'
import Search from '~/components/sidebar/search'
import Sidebar from '~/components/sidebar/sidebar'
import SortBy from '~/components/sidebar/sortBy'
import type { LoaderFunction } from '@remix-run/node'
import { Form, useSearchParams, useSubmit } from '@remix-run/react'
import { useState } from 'react'
import { Button } from '~/components/primitives/button'
import { ReposQuery } from '~/graphql/queries/repos'
import type { LoadReposQuery } from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadReposQuery>(ReposQuery, undefined)
  return data?.repos
}

export default function ItemsMenuWrapper() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const buttonText = sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'

  const submit = useSubmit()

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
        aria-label="Filterable Sidebar"
      >
        <Form
          action={'.'}
          method="get"
          onChange={(e) => submit(e.currentTarget)}
          className="space-y-2"
          aria-label="Filter Form"
        >
          <Search searchParams={searchParams} aria-label="Search Input" />
          <FilterByRepository
            searchParams={searchParams}
            aria-label="Filter by Repository Select"
          />
          <SortBy aria-label="Sort By Select" />{' '}
          <Button
            type="button"
            onClick={() => {
              setSearchParams({
                q: '',
                type: 'title',
                repoDid: 'all',
                orderBy: 'TITLE_DESC',
              })
            }}
            className="text-white font-bold bg-brand-primary w-full py-2 px-4  hover:bg-brand-secondary focus:outline-none focus:ring-2 "
            aria-label="Reset Button"
          >
            Reset
          </Button>
        </Form>
      </Sidebar>
    </div>
  )
}
