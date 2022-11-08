import { cva, cx, VariantProps } from 'class-variance-authority'

const styles = cva('p-4 rounded-lg border shadow-md', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantSize: {
      md: '',
      full: 'w-full',
    },
    variant: {
      default: [' dark:bg-gray-800 dark:border-gray-700'],
      centered: [
        'justify-center text-center',
        'dark:bg-gray-800 dark:border-gray-700',
      ],
      bare: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Card(props: CardProps) {
  const className = cx(styles(props))
  return <div className={className} {...props}></div>
}
export type CardProps = CardBaseProps &
  React.DetailsHTMLAttributes<HTMLDivElement>
export interface CardBaseProps extends VariantProps<typeof styles> {}
