import {
  Cross1Icon,
  PlayIcon,
  PlusIcon,
  ReaderIcon,
  TrashIcon,
} from '@radix-ui/react-icons'
import { Link } from '@remix-run/react'
import { useState } from 'react'
import { usePlayer } from '~/components/player/player'
import { Button, IconButton } from '~/components/primitives/button'
import { usePlaylists } from './use-playlists'
import { useQueue } from './use-queue'

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
          <form className="flex flex-col">
            <h3 className="text-sm text-brand-primary">create playlist</h3>
            <label
              id="label"
              aria-label="name-input"
              className="text-xs"
              htmlFor="playlistName"
            >
              Name
            </label>

            <input
              className="h-8"
              type="text"
              aria-labelledby="label"
              id="playlistName"
              value={playlistName || ''}
              onChange={(e) => {
                setPlaylistName(e.currentTarget.value)
              }}
            />
          </form>

          <Button
            disabled={playlistName ? false : true}
            placeholder="playlist name"
            aria-label="save playlist"
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
        <Button
          aria-label={'hide queue'}
          onClick={() => player?.setQueueVisibility(false)}
        >
          <Cross1Icon />
        </Button>
      </div>
      <div
        role="region"
        aria-label="queue"
        className="overflow-auto max-h-56 z-50"
      >
        <ul>
          {player?.tracks.map((track, i) => {
            const style =
              player.track?.uid === track.uid
                ? ' bg-white justify-between px-2 flex items-center my-2'
                : ' bg-slate-100 justify-between px-2 flex items-center my-2 pl-4'
            const label = i + 1 + ' ' + track.title
            return (
              <li key={i} className={style}>
                <div className="flex items-center">
                  {player.track?.uid === track.uid && <PlayIcon />}
                  <Button
                    onClick={() => player.setTrackIndex(i)}
                    className="p-2 text-sm truncate"
                    aria-label={label}
                  >
                    {label}
                  </Button>
                </div>
                <div className="flex space-x-1">
                  <Link
                    className="flex space-x-1"
                    id={i.toString()}
                    aria-label={'link to item'}
                    to={'/items/' + track.contentItemUid}
                  >
                    <IconButton
                      aria-describedby={i.toString()}
                      tooltip={'link to item'}
                      icon={<ReaderIcon />}
                    />
                  </Link>

                  <IconButton
                    tooltip="remove Track from Queue"
                    onClick={() => {
                      replaceCurrentQueue(
                        tracks.filter((item) => track.uid !== item.uid),
                      )
                    }}
                    intent={'danger'}
                    icon={<TrashIcon />}
                  />
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
