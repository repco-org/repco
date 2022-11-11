import { NavLink, NavLinkProps } from '@remix-run/react'
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
        icon: '!p-1',
        md: 'py-1 px-3 text-md font-medium',
        sm: 'py-1 px-2 text-sm font-medium',
      },
      variant: {
        default: [
          'text-white',
          'bg-blue-700 hover:bg-blue-800 placeholder:focus:ring-blue-300',
          'dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
          'focus:ring-4 focus:outline-none inline-flex',
        ],
        inline: [
          'text-white',
          'bg-blue-700 hover:bg-blue-800 placeholder:focus:ring-blue-300',
          'dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800',
          'absolute right-5 bottom-0.5 focus:ring-4 focus:outline-none',
          'py-1 px-2 text-sm font-medium',
        ],

        bare: '',
      },
    },
    defaultVariants: {
      variantSize: 'sm',
      variant: 'default',
    },
  },
)

export function Button(props: ButtonProps) {
  const className = cx(styles(props))
  return <button className={className} {...props} />
}

export type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement>

export interface ButtonBaseProps extends VariantProps<typeof styles> {}

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

export type NavButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  NavLinkProps
