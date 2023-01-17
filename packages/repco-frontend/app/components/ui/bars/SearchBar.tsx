import { Form, useSubmit } from '@remix-run/react'
import { CollapsibleFilter } from '../Collapsible'
import { InputWithIcon } from '../primitives/Input'

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
        <InputWithIcon
          name="includes"
          type="search"
          variant="icon"
          placeholder="Search Titles..."
          icon="search"
        />
      </div>

      <CollapsibleFilter />
    </Form>
  )
}
