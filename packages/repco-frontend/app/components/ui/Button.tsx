import { NavLink, NavLinkProps } from '@remix-run/react'
import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'
import { ClassProp } from 'class-variance-authority/dist/types'

const styles = cva('', {
  variants: {
    disabled: {
      true: 'opacity-70 pointer-events-none cursor-not-allowed',
    },
    variantSize: {
      icon: '!p-1',
      md: 'py-1 px-3 text-base ',
      sm: 'py-1 px-2 text-sm',
    },
    variant: {
      default: [
        'border rounded-md items-center transition-colors duration-100 cursor-default disabled:opacity-50',
        'text-blue-700',
        'bg-white-700 hover:text-purple-500 placeholder:focus:ring-purple-500',
        'focus:ring-2 focus:outline-none inline-flex',
      ],

      bare: '',
    },
  },
  defaultVariants: {
    variantSize: 'sm',
    variant: 'default',
  },
})

export interface ButtonBaseProps extends VariantProps<typeof styles> {}

export type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ClassProp

export type NavButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  NavLinkProps &
  ClassProp

export function Button(props: ButtonProps) {
  const className = cx(styles(props))
  return <button className={className} {...props} />
}

export function NavButton(props: NavButtonProps) {
  const className = cx(styles(props))
  return (
    <NavLink {...props}>
      <button className={className} {...props} />
    </NavLink>
  )
}

export function NextButton(props: NavButtonProps) {
  return (
    <NavButton {...props}>
      <div className="flex flex-row align-middle">
        <span className="mr-2"> Next </span>
        <svg
          className="w-5 ml-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </div>
    </NavButton>
  )
}

export function PrevButton(props: NavButtonProps) {
  return (
    <NavButton {...props}>
      <div className="flex flex-row align-middle">
        <span className="mr-2"> Prev </span>

        <svg
          className="w-5 mr-1"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          ></path>
        </svg>
      </div>
    </NavButton>
  )
}
