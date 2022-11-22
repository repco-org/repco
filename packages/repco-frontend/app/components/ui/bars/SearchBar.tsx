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

      <CollapsibleFilter />
    </Form>
  )
}
