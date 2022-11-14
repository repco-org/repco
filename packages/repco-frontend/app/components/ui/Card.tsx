import { cva, cx, VariantProps } from 'class-variance-authority'
import { ClassProp } from 'class-variance-authority/dist/types'
import DropdownMenuDemo from './Dropdown'

const styles = cva('p-4 rounded-lg border shadow-xs', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantSize: {
      md: 'w-80',
      full: 'w-full',
    },
    variant: {
      default: ['my-1'],
      centered: ['justify-center text-center'],
      bare: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Card(props: CardProps) {
  const className = cx(styles(props))
  return (
    <div className={className} {...props}>
      {' '}
      <DropdownMenuDemo />
      {props.children}
    </div>
  )
}
export type CardProps = CardBaseProps &
  React.DetailsHTMLAttributes<HTMLDivElement> &
  ClassProp
export interface CardBaseProps extends VariantProps<typeof styles> {}
