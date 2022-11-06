import { cva, cx, VariantProps } from 'class-variance-authority'
import { Button, ButtonProps } from './Button'
import { Input, InputProps } from './Input'

const styles = cva('relative', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantSize: {
      md: 'py-1 px-3 text-md font-medium',
    },
    variant: {
      default: [''],

      bare: '',
    },
  },
  defaultVariants: {
    variantSize: 'md',
    variant: 'default',
  },
})

export function SearchBar(props: SearchBarBaseProps) {
  const className = cx(styles(props))
  return (
    <div className={className}>
      <div className="absolute left-5 py-1.5">
        <svg
          aria-hidden="true"
          className="w-5 h-5 text-gray-500 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
      <Input variant="withBtn" />
      <Button variant="inline">Search</Button>
    </div>
  )
}

export type SearchBarProps = SearchBarBaseProps & ButtonProps & InputProps

export interface SearchBarBaseProps extends VariantProps<typeof styles> {}
