import { ArrowDownIcon, ArrowUpIcon } from '@radix-ui/react-icons'
import { useSearchParams } from '@remix-run/react'
import { IconButton } from '../primitives/button'

type SortOrder = {
  TITLE_DESC: {
    name: string
    value: string
    icon: JSX.Element
    ariaLabel: string
  }
  TITLE_ASC: {
    name: string
    value: string
    icon: JSX.Element
    ariaLabel: string
  }
}

export default function SortBy(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams()
  const orderBy = searchParams.get('orderBy')
  const sortOrder: SortOrder = {
    TITLE_DESC: {
      name: 'Title (A-Z)',
      value: 'TITLE_ASC',
      icon: <ArrowDownIcon />,
      ariaLabel: 'Sort by title in descending order',
    },
    TITLE_ASC: {
      name: 'Title (Z-A)',
      value: 'TITLE_DESC',
      icon: <ArrowUpIcon />,
      ariaLabel: 'Sort by title in ascending order',
    },
  }
  const sortOrderKeys = Object.keys(sortOrder) as Array<keyof SortOrder>
  const order = sortOrderKeys.find((key) => key === orderBy) || sortOrderKeys[0]
  const { name, value, icon, ariaLabel } = sortOrder[order]

  const handleClick = () => setSearchParams({ orderBy: value })

  return (
    <div>
      <h2 className="text-lg pt-2 w-full border-b-2 border-gray-200">
        Sort by
      </h2>
      <div>
        <IconButton
          type="submit"
          name="orderBy"
          value={value}
          className="text-brand-primary"
          onClick={handleClick}
          icon={icon}
          aria-label={ariaLabel}
        >
          {name}
        </IconButton>
      </div>
    </div>
  )
}
