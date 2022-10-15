import { Form } from '@remix-run/react'

export default function Playlists() {
  return (
    <div>
      <Form method="get" action="/playlists/new">
        <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
          Create new Playlist
        </button>
      </Form>
    </div>
  )
}
