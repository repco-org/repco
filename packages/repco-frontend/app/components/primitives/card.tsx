import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'
import type { ClassProp } from 'class-variance-authority/dist/types'

const styles = cva('p-4', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantsize: {
      md: 'w-3/4',
      full: 'w-full',
    },
    variant: {
      default: ['my-2 shadow-md hover:shadow-lg b-0'],
      centered: ['justify-center flex-shrink text-center'],
      hover: ['block my-2 bg-white shadow-md hover:bg-gray-100'],
      bare: '',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function ContentItemCard(props: CardProps) {
  const className = cx(styles(props))
  return (
    <div className={className} {...props}>
      <div className="flex flex-row w-full">
        <div className="px-4 w-full">{props.children}</div>
      </div>
    </div>
  )
}

export type CardProps = CardBaseProps &
  React.DetailsHTMLAttributes<HTMLDivElement> &
  ClassProp
export interface CardBaseProps extends VariantProps<typeof styles> {}
