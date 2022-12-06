import { useState } from 'react'
import { usePlaylists } from '~/lib/usePlaylists'
import { Button } from '../primitives/Button'
import { IconAddInput } from '../primitives/Input'

export function NewPlaylistBar() {
  const [input, setInput] = useState('')
  const [playlists, _store, newPlaylist] = usePlaylists()
  return (
    <div className="py-2 flex">
      <IconAddInput
        name="includes"
        id="includes"
        type="text"
        variant="icon"
        value={input}
        placeholder="add new playlist..."
        onChange={(e: any) => setInput(e.target.value)}
      />
      <Button
        onClick={() => {
          if (input !== '') {
            setInput('')
            newPlaylist(input)
          }
        }}
      >
        new
      </Button>
    </div>
  )
}
