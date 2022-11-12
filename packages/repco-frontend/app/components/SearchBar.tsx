import { Form } from '@remix-run/react'
import { Button } from './ui/Button'
import { SearchInput } from './ui/Input'

export function SearchBar() {
  return (
    <Form action="/items/" method="get">
      <div className="flex">
        <SearchInput
          name="includes"
          type="search"
          variant="search"
          variantSize="sm"
          placeholder="Search Titles..."
        />

        <Button type="submit">Search</Button>
      </div>
    </Form>
  )
}
