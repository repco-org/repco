import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'
import type { ClassProp } from 'class-variance-authority/dist/types'

const styles = cva('p-4  shadow-xs', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantSize: {
      md: 'w-3/4',
      full: 'w-full',
    },
    variant: {
      default: ['my-1'],
      centered: ['justify-center flex-shrink text-center'],
      hover: [
        'block my-2 bg-white  border-gray-200 shadow-md hover:bg-gray-100',
      ],
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
      <div className="flex flex-row">
        <div className="w-full px-4">
          <div>{props.children}</div>
        </div>
      </div>
    </div>
  )
}
type Props = {
  node: string
}
export type CardProps = CardBaseProps &
  React.DetailsHTMLAttributes<HTMLDivElement> &
  ClassProp &
  Props
export interface CardBaseProps extends VariantProps<typeof styles> {}
