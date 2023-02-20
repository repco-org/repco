//thx Kent
import clsx from 'clsx'
import { MoonIcon, SunIcon } from '~/components/Icons'
import { Theme, Themed, useTheme } from '~/lib/theme-provider'

const iconTransformOrigin = { transformOrigin: '50% 100px' }
export function DarkModeToggle({
  variant = 'icon',
}: {
  variant?: 'icon' | 'labelled'
}) {
  const [, setTheme] = useTheme()
  return (
    <button
      aria-label="Toggle dark mode"
      onClick={() => {
        setTheme((previousTheme) =>
          previousTheme === Theme.DARK ? Theme.LIGHT : Theme.DARK,
        )
      }}
      className={clsx(
        'ml-1 p-1 inline-flex  items-center rounded-[5px] justify-center overflow-hidden transition text-[1.2rem] bg-[#ffa8dc]',
        {
          'w-10': variant === 'icon',
          'px-8': variant === 'labelled',
        },
      )}
    >
      {/* note that the duration is longer then the one on body, controlling the bg-color */}
      <div className="search-form relative h-7 w-7">
        <span
          className="absolute inset-0 rotate-90 transform transition duration-1000 motion-reduce:duration-[0s] dark:rotate-0"
          style={iconTransformOrigin}
        >
          <MoonIcon />
        </span>
        <span
          className="absolute inset-0 rotate-0 transform transition duration-1000 motion-reduce:duration-[0s] dark:-rotate-90 "
          style={iconTransformOrigin}
        >
          <SunIcon />
        </span>
      </div>
      <span
        className={clsx('ml-4  ', {
          'sr-only': variant === 'icon',
        })}
      >
        <Themed dark="switch to light mode" light="switch to dark mode" />
      </span>
    </button>
  )
}
