import { Form, useSearchParams, useSubmit } from '@remix-run/react'

export function Filter() {
  const submit = useSubmit()
  const [searchParams, setSearchParams] = useSearchParams()
  const includes = searchParams.get('includes')
  //      action={`/items?orderBy=${orderBy}&includes=${includes}`}

  function handleChange(event: any) {
    submit(event.currentTarget)
  }
  return (
    <Form action="/items" method="get">
      <div className="flex">
        <label className="py-1 px-2 text-sm font-medium">Order</label>
        <select
          name="filter"
          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full  dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
          onChange={(e) => {
            setSearchParams(`orderBy=${e.target.value}`)
          }}
        >
          <option value="TITLE_ASC">Title ASC</option>
          <option value="TITLE_DESC">Title DESC</option>
        </select>
      </div>
    </Form>
  )
}
