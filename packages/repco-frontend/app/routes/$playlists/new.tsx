import { ActionFunction } from '@remix-run/node'
import { Form, useActionData } from '@remix-run/react'
import { useEffect } from 'react'

export const action: ActionFunction = async ({ request }) => {
  let formData = await request.formData()
  const data = (formData.get('create-playlist') || '').toString()
  return data
}

/**
 * Add an item to a localStorage() array
 * @param {String} name  The localStorage() key
 * @param {String} value The localStorage() value
 */
var addToLocalStorageArray = function (name: string, value: string) {
  // Get the existing data
  var existing: any = localStorage.getItem(name)

  // If no existing data, create an array
  // Otherwise, convert the localStorage string to an array
  existing = existing ? existing.split(',') : []

  // Add new data to localStorage Array
  existing.push(value)

  // Save back to localStorage
  localStorage.setItem(name, existing.toString())
}

export default function New() {
  const data = useActionData()
  console.log(data)
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     if (localStorage.getItem('playlists')) return
  //     addToLocalStorageArray('playlists', '')
  //   }
  // })
  useEffect(() => {
    if (typeof window !== 'undefined') {
      addToLocalStorageArray('playlists', data)
    }
  }, [data])
  return (
    <div>
      <Form method="post" action="/playlists/new">
        <div className="flex flex-row py-2 px-4">
          <input
            type="text"
            name="create-playlist"
            id="create-playlist"
            className="block p-4 pl-10 w-1/4 text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            placeholder="enter name..."
          />
          <button className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
            create new playlist
          </button>
        </div>
      </Form>
    </div>
  )
}
