import { useState } from 'react'
import { setStorage } from '~/lib/helpers'
import { Button } from '../primitives/Button'
import { IconAddInput } from '../primitives/Input'

export function NewPlaylistBar() {
  const [input, setInput] = useState('')
  function newPlaylist() {
    const timestamp = Date.now()
    const date = new Date(timestamp)
    const dd_mm_yyyy = date.toLocaleDateString()
    const time = date.toLocaleTimeString()
    setStorage('playlists', input + ' ' + dd_mm_yyyy + ' ' + time)
    location.reload()
  }
  return (
    <div className="py-2 flex">
      <IconAddInput
        name="includes"
        id="includes"
        type="text"
        variant="icon"
        variantSize="sm"
        placeholder="add new playlist..."
        onChange={(e: any) => setInput(e.target.value)}
      />
      <Button
        onClick={() => {
          newPlaylist()
        }}
      >
        new
      </Button>
    </div>
  )
}
