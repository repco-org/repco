import { useFetcher } from '@remix-run/react'

export function Select() {
  const fetcher = useFetcher()

  const handleSelect = (selectedValue: any) => {
    // programmatically submit a useFetcher form in Remix
    fetcher.submit({ selected: selectedValue }, { method: 'post', action: '/' })
  }

  return <select onSelect={handleSelect} />
}
