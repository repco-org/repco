import { Outlet } from '@remix-run/react'

export default function Playlists() {
  return (
    <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-opacity-90">
      <div className="container mx-auto px-4">
        <Outlet />
      </div>
    </div>
  )
}
