import { Outlet } from '@remix-run/react'
import type { Dispatch, ReactNode, SetStateAction } from 'react'

type Props = {
  sidebarWidth: string
  sidebarOpen: boolean
  setSidebarOpen: Dispatch<SetStateAction<boolean>>
  children: ReactNode
}

export default function FilterableMain({
  sidebarWidth,
  children,
  sidebarOpen,
}: Props) {
  return (
    <div className="flex">
      {sidebarOpen && (
        <div
          className={`flex flex-col px-4 py-8 overflow-y-auto border-r ${sidebarWidth}`}
        >
          <div className="flex flex-col justify-between mt-6 ">
            <aside>{children}</aside>
          </div>
        </div>
      )}
      <main
        className={`flex-1 h-full p-4 m-8 overflow-y-auto ${
          sidebarOpen ? '' : 'w-auto'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
