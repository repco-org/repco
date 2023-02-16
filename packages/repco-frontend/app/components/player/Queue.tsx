import {
  Cross1Icon,
  PlayIcon,
  PlusIcon,
  ReaderIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { Link } from '@remix-run/react'
import { useState } from 'react'
import { usePlayer } from '~/components/player/Player'
import { Button } from '~/components/ui/primitives/Button'
import { useQueue } from '~/lib/usePlayQueue'
import { usePlaylists } from './usePlaylists'

export const QueueView = () => {
  const player = usePlayer()
  const { createPlaylist, error } = usePlaylists()
  const { tracks, replaceCurrentQueue } = useQueue()
  const [playlistName, setPlaylistName] = useState<string | null>(null)
  return (
    <div
      className={
        player?.queueVisibility ? 'max-h-83 container py-4 shadow-lg' : 'hidden'
      }
    >
      <div className="flex justify-between bg-slate-200 top-0 sticky py-4 border-b-2 border-b-brand-primary">
        <div className="flex space-x-2 items-end">
          {error && <p>{error}</p>}
          <div className="flex flex-col">
            <h5 className="text-sm text-brand-primary">create playlist</h5>
            <label className="text-xs" htmlFor="playlistName">
              Name
            </label>

            <input
              className="h-8"
              type="text"
              id="playlistName"
              value={playlistName || ''}
              onChange={(e) => {
                setPlaylistName(e.currentTarget.value)
              }}
            />
          </div>
          <Button
            disabled={playlistName ? false : true}
            placeholder="playlist name"
            onClick={() => {
              if (playlistName && playlistName.length > 0) {
                createPlaylist(playlistName, {
                  id: playlistName,
                  tracks: tracks,
                })
              }
            }}
          >
            <PlusIcon />
          </Button>
        </div>
        <Button onClick={() => player?.setQueueVisibility(false)}>
          <Cross1Icon />
        </Button>
      </div>
      <div className="overflow-auto max-h-56 z-50">
        <ul>
          {player?.tracks.map((track, i) => {
            const style =
              player.track?.uid === track.uid
                ? ' bg-white justify-between px-2 flex items-center my-2'
                : ' bg-slate-100 justify-between px-2 flex items-center my-2 pl-4'
            return (
              <li key={i} className={style}>
                <div className="flex items-center">
                  {player.track?.uid === track.uid && <PlayIcon />}
                  <Button
                    onClick={() => player.setTrackIndex(i)}
                    className="p-2 text-sm truncate"
                  >
                    {i + 1 + ' '}
                    {track.title}
                  </Button>
                </div>
                <div className="flex space-x-1">
                  <Button intent={'primary'}>
                    <Link to={'/items/' + track.contentItemUid}>
                      <ReaderIcon />
                    </Link>
                  </Button>

                  <Button
                    onClick={() => {
                      replaceCurrentQueue(
                        tracks.filter((item) => track.uid !== item.uid),
                      )
                    }}
                    intent={'danger'}
                  >
                    <TrashIcon />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
