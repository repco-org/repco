import type { NavLinkProps } from '@remix-run/react'
import { NavLink } from '@remix-run/react'
import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'
import type { ClassProp } from 'class-variance-authority/dist/types'
import { forwardRef } from 'react'

export const buttonStyles = cva(
  'border rounded-md items-center transition-colors duration-100 cursor-default disabled:opacity-50',
  {
    variants: {
      intent: {
        primary: '',
        danger: 'bg-red-500',
      },
      fullWidth: {
        true: 'w-full',
      },
      disabled: {
        true: 'opacity-70 pointer-events-none cursor-not-allowed',
      },
      variantSize: {
        icon: '!p-1',
        md: 'py-1 px-3 text-base ',
        sm: 'py-1 px-2 text-sm',
      },
    },
    defaultVariants: {
      variantSize: 'sm',
    },
  },
)

export interface ButtonBaseProps extends VariantProps<typeof buttonStyles> {}

export type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ClassProp

export type IconButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ClassProp & {
    icon?: JSX.Element
  }

export type NavButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  NavLinkProps &
  ClassProp

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => {
    const className = cx(buttonStyles(props))
    return <button ref={ref} className={className} {...props} />
  },
)

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (props, ref) => {
    const className = cx(buttonStyles(props))
    const icon = props.icon
    return (
      <button
        ref={ref}
        className={className}
        {...props}
        style={{ minWidth: '2rem' }}
      >
        <div className="py-2 px-4 rounded inline-flex items-center">
          <div className="mr-2">{props.children}</div>
          {icon ? icon : null}
        </div>
      </button>
    )
  },
)

export function NavButton(props: NavButtonProps) {
  const className = cx(buttonStyles(props))
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

Button.displayName = 'Button'
IconButton.displayName = 'IconButton'
