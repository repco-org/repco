import * as Tooltip from '@radix-ui/react-tooltip'
import type { NavLinkProps } from '@remix-run/react'
import { NavLink } from '@remix-run/react'
import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'
import type { ClassProp } from 'class-variance-authority/dist/types'
import { forwardRef } from 'react'
import { NextPageIcon, PrevPageIcon } from '../icons'

export const buttonStyles = cva(
  '  text-white font-bold shrink-0 items-center transition-colors duration-100 cursor-default disabled:opacity-50',
  {
    variants: {
      intent: {
        primary: ' bg-brand-primary  hover:bg-brand-secondary',
        active: 'bg-brand-secondary hover:bg-brand-primary',
        secondary: 'bg-brand-contrast hover:bg-slate-400',
        danger: 'bg-red-500 hover:bg-red-300 ',
      },
      fullWidth: {
        true: 'w-full',
      },
      disabled: {
        true: 'opacity-70 pointer-events-none cursor-not-allowed',
      },
      variantSize: {
        md: 'py-1 px-3 text-base  ',
        sm: 'py-1 px-2 text-sm h-auto',
      },
    },
    defaultVariants: {
      variantSize: 'sm',
      intent: 'primary',
    },
  },
)

export interface ButtonBaseProps extends VariantProps<typeof buttonStyles> {}

export type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ClassProp

export type ButtonWithIconProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ClassProp & {
    icon?: JSX.Element
  }

export type NavButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  NavLinkProps &
  ClassProp

export type IconButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  ClassProp & {
    icon: JSX.Element
    children?: never
    tooltip?: string
    label?: string
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ fullWidth, variantSize, intent, ...props }, ref) => {
    const className = cx(
      buttonStyles({ fullWidth, variantSize, intent, ...props }),
    )
    return <button ref={ref} className={className} {...props} />
  },
)

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, fullWidth, variantSize, intent, tooltip, label, ...props }, ref) => {
    const className = cx(
      buttonStyles({ fullWidth, variantSize, intent, ...props }),
    )
    const tooltipId = `${props.id}-tooltip`

    return (
      <Tooltip.Provider>
        <Tooltip.Root>
          <Tooltip.Trigger
            asChild
            role="button"
            aria-label={tooltip || label}
            title={tooltip}
            tabIndex={0}
          >
            <button
              ref={ref}
              className={className}
              {...props}
              aria-label={label || tooltip}
              aria-describedby={tooltip}
            >
              <div className="items-center">{icon ? icon : null}</div>
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content
            className="TooltipContent"
            id={tooltipId}
            sideOffset={5}
            style={{
              backgroundColor: 'white',
              color: 'black',
              borderRadius: '4px',
              border: '1px solid #ccc',
              padding: '8px',
            }}
          >
            {tooltip}
            <Tooltip.Arrow
              className="TooltipArrow"
              style={{
                borderColor: 'white transparent transparent transparent',
              }}
            />
          </Tooltip.Content>
        </Tooltip.Root>
      </Tooltip.Provider>
    )
  },
)

export const ButtonWithIcon = forwardRef<
  HTMLButtonElement,
  ButtonWithIconProps
>(({ icon, fullWidth, variantSize, intent, ...props }, ref) => {
  const className = cx(
    buttonStyles({ fullWidth, variantSize, intent, ...props }),
  )

  return (
    <button
      ref={ref}
      className={className}
      {...props}
      style={{ minWidth: '2rem' }}
    >
      <div className="rounded inline-flex items-center">
        <div className="mr-2">{props.children}</div>
        {icon ? icon : null}
      </div>
    </button>
  )
})

export function NavButton(props: NavButtonProps) {
  const className = cx(buttonStyles(props))
  return (
    <NavLink {...props}>
      <button
        className={className}
        aria-label={props['aria-label']}
        aria-disabled={props.disabled}
        title={props.title}
        {...props}
      />
    </NavLink>
  )
}

export function NextPageButton(props: NavButtonProps) {
  return (
    <NavButton {...props}>
      <div
        className="flex flex-row align-middle"
        title="Go to next page"
        aria-label="Go to next page"
      >
        <span> Next </span>
        <NextPageIcon />
      </div>
    </NavButton>
  )
}

export function PrevPageButton(props: NavButtonProps) {
  return (
    <NavButton
      {...props}
      title="Go to Previous Page"
      aria-label="Go to Previous Page"
    >
      <div className="flex flex-row align-middle">
        <PrevPageIcon />
        <span> Prev </span>
      </div>
    </NavButton>
  )
}

Button.displayName = 'Button'
ButtonWithIcon.displayName = 'ButtonWithIcon'
IconButton.displayName = 'IconButton'
