import * as RadioGroup from '@radix-ui/react-radio-group'
import {
  ArrowDownIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons'
import type { LoaderFunction } from '@remix-run/node'
import {
  Form,
  Outlet,
  useLoaderData,
  useSearchParams,
  useSubmit,
} from '@remix-run/react'
import { IconButton } from '~/components/ui/primitives/Button'
import { InputWithIcon } from '~/components/ui/primitives/Input'
import { ReposQuery } from '~/graphql/queries/repos'
import type { LoadReposQuery, Repo } from '~/graphql/types.js'
import { graphqlQuery } from '~/lib/graphql.server'

export const loader: LoaderFunction = async ({ request }) => {
  const { data } = await graphqlQuery<LoadReposQuery>(ReposQuery, undefined)
  return data?.repos
}

export default function ItemsMenuWrapper() {
  const [searchParams] = useSearchParams()
  const orderBy = searchParams.get('orderBy')
  const repoDid = searchParams.get('repoDid') || 'all'
  const repos = useLoaderData<typeof loader>()

  const submit = useSubmit()
  return (
    <div className="flex">
      <div className="flex flex-col px-4 py-8 overflow-y-auto border-r w-80 ">
        <div className="flex flex-col justify-between mt-6 ">
          <aside>
            <Form
              action={'.'}
              method="get"
              onChange={(e) => submit(e.currentTarget)}
              className='space-y-2'
            >
              <InputWithIcon
                name="includes"
                id="includes"
                type="text"
                autoFocus
                placeholder="Title contains.."
                icon={<MagnifyingGlassIcon />}
                defaultValue={searchParams.get('includes') || ''}
                onChange={(e) => {
                  if (e.currentTarget.value !== '') {
                    searchParams.set('includes', e.currentTarget.value)
                  } else {
                    searchParams.delete('includes')
                  }
                  submit(searchParams)
                  e.stopPropagation()
                }}
              />
              <h2 className="text-lg pt-2 w-full border-b-2 border-gray-200">
                Filter by Repositorys
              </h2>
              <div className="flex items-center space-x-2">
                <RadioGroup.Root
                  className="flex flex-col space-y-2"
                  defaultValue={repoDid}
                  aria-label="View density"
                  name="repoDid"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroup.Item
                      className="bg-brand-primary w-4 h-4 rounded-full"
                      value="all"
                      id="all"
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
                  ))}
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
            </Form>
          </aside>
        </div>
      </div>
      <main className="w-full h-full p-4 m-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
