import { Form, useSubmit } from '@remix-run/react'
import { CollapsibleFilter } from '../Collapsible'
import { IconSearchInput } from '../primitives/Input'

export function SearchBar({ path }: { path: string }) {
  const submit = useSubmit()
  return (
    <Form
      action={path}
      method="get"
      onChange={(e) => {
        submit(e.currentTarget)
      }}
    >
      <div className="flex">
        <IconSearchInput
          name="includes"
          type="search"
          variant="icon"
          variantSize="sm"
          placeholder="Search Titles..."
        />
      </div>
      {/* <div className="flex">
        <select
          name="orderBy"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
          <option value="TITLE_ASC">Title ASC</option>
          <option value="TITLE_DESC">Title DESC</option>
        </select>
      </div> */}
      <CollapsibleFilter />
    </Form>
  )
}
