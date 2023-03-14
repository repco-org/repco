import * as RadioGroup from '@radix-ui/react-radio-group'
import React from 'react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { useSearchParams } from '@remix-run/react'
import { InputWithIcon } from '../primitives/input'

interface SearchProps {
  searchParams: URLSearchParams
}

export default function Search(props: SearchProps) {
  const { searchParams } = props
  const [, setSearchParams] = useSearchParams()
  const input = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'title'

  const handleRadioChange = React.useCallback(
    (value: string) => {
      setSearchParams((params) => {
        params.set('type', value)
        return new URLSearchParams(params)
      })
    },
    [setSearchParams],
  )

  return (
    <div>
      <InputWithIcon
        name="q"
        id="q"
        type="text"
        autoFocus
        placeholder="Search"
        tooltip="submit the input"
        icon={<MagnifyingGlassIcon />}
        defaultValue={input}
        aria-label="Search"
      />
      <h2 className="text-lg mt-2 pt-2 w-full border-b-2 border-gray-200">
        Search
      </h2>

      <div className="flex items-center space-x-2">
        <RadioGroup.Root
          className="flex flex-col mt-4 space-y-2"
          value={type}
          onValueChange={handleRadioChange}
          aria-label="Search by"
          name="type"
        >
          <div className="flex items-center space-x-2">
            <RadioGroup.Item
              className="bg-brand-primary w-4 h-4 rounded-full"
              value="title"
              id="title"
            >
              <RadioGroup.Indicator
                className="flex
                        items-center  justify-center w-full h-full relative
                        after:block   after:w-2 after:h-2 after:rounded-full after:bg-white"
              />
            </RadioGroup.Item>
            <label className="text-sm" htmlFor="title">
              Search in titles
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroup.Item
              className="bg-brand-primary w-4 h-4 rounded-full"
              value="fulltext"
              id="fulltext"
            >
              <RadioGroup.Indicator
                className="flex
                        items-center  justify-center w-full h-full relative
                        after:block   after:w-2 after:h-2 after:rounded-full after:bg-white"
              />
            </RadioGroup.Item>
            <label className="text-sm" htmlFor="fulltext">
              Search in full text
            </label>
          </div>
        </RadioGroup.Root>
      </div>
    </div>
  )
}
