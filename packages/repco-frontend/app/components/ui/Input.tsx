import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'

const styles = cva(
  ' border rounded-md items-center transition-colors duration-100 cursor-default disabled:opacity-50',
  {
    variants: {
      disabled: {
        true: 'opacity-70 pointer-events-none cursor-not-allowed',
      },
      variantSize: {
        md: 'py-1 px-3 text-md font-medium',
        sm: 'py-1 px-2 text-sm font-medium',
        full: 'w-full',
      },
      variant: {
        default: [
          'block  text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
        ],
        withBtn: [
          'block w-full text-md text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500',
        ],
        bare: '',
      },
    },
    defaultVariants: {
      variantSize: 'md',
      variant: 'default',
    },
  },
)

export function Input(props: InputProps) {
  const className = cx(styles(props))

  return <input className={className} {...props} />
}

export type InputProps = InputBaseProps &
  React.InputHTMLAttributes<HTMLInputElement>

export interface InputBaseProps extends VariantProps<typeof styles> {}
