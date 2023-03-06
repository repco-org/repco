import * as Separator from '@radix-ui/react-separator'
import * as Tooltip from '@radix-ui/react-tooltip'
import React from 'react'
import type { VariantProps } from 'class-variance-authority'
import { cva, cx } from 'class-variance-authority'
import type { ClassProp } from 'class-variance-authority/dist/types'

const styles = cva(
  'border rounded-lg transition-colors duration-100 outline-none focus:border-primary-500 disabled:opacity-50',
  {
    variants: {
      disabled: {
        true: 'opacity-70 pointer-events-none',
      },
      size: {
        md: 'py-2 px-4 text-md font-medium',
        sm: 'py-1 px-3 text-sm font-medium',
      },
      variant: {
        default: ['block w-full', 'text-gray-900 placeholder-gray-400'],
        icon: ['block w-full', 'text-gray-900 placeholder-gray-400 pr-10'],
        bare: '',
      },
      responsive: {
        md: ['text-md'],
        lg: ['text-lg'],
        xl: ['text-xl'],
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      responsive: null,
    },
  },
)

export type InputIconProps = InputProps & {
  icon?: React.ReactNode
  tooltip?: string
  label?: string
  responsive?: 'md' | 'lg' | 'xl' | null
}

export type InputProps = InputBaseProps &
  React.InputHTMLAttributes<HTMLInputElement> &
  ClassProp

export interface InputBaseProps extends VariantProps<typeof styles> {}

export function InputWithIcon(props: InputIconProps) {
  const { icon, tooltip, label, responsive, ...inputProps } = props
  const className = cx(styles({ ...props, variant: 'icon' }), responsive)
  const tooltipId = `${inputProps.id}-tooltip`

  return (
    <div className="relative flex items-center">
      <label htmlFor={inputProps.id} className="sr-only">
        {label}
      </label>
      <input
        className={className}
        {...inputProps}
        aria-label={label || tooltip}
        aria-describedby={tooltipId}
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
        <Separator.Root
          className="bg-gray-200 w-px m-3 h-6"
          orientation="vertical"
        />
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger
              asChild
              role="button"
              aria-label={tooltip}
              title={tooltip}
              tabIndex={0}
            >
              <button
                type="submit"
                className="text-gray-600 mr-1 hover:text-black focus:text-black focus:outline-none"
              >
                {icon}
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
      </div>
    </div>
  )
}
