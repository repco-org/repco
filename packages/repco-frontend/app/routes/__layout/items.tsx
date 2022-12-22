import {
  ArrowDownIcon,
  ArrowUpIcon,
  MagnifyingGlassIcon,
} from '@radix-ui/react-icons'
import { Form, Outlet, useSearchParams, useSubmit } from '@remix-run/react'
import { IconButton } from '~/components/ui/primitives/Button'
import { InputWithIcon } from '~/components/ui/primitives/Input'

export default function ItemsMenuWrapper() {
  const [searchParams] = useSearchParams()
  const orderBy = searchParams.get('orderBy')

  const submit = useSubmit()
  return (
    <div className="flex">
      <div className="flex flex-col px-4 py-8 overflow-y-auto border-r w-80 ">
        <div className="flex flex-col justify-between mt-6 ">
          <aside>
            <Form action={'.'} method="get">
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
      <div className="w-full h-full p-4 m-8 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  )
}
