import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  ListBulletIcon,
  PauseIcon,
  PlayIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from '@radix-ui/react-icons'
import type { PropsWithChildren } from 'react'
import type { Track } from './use-playlists'
import { useQueue } from './use-queue'
import { Button, IconButton } from '../primitives/button'

type PlayerContextType = {
  track: Track | null
  setTrack: React.Dispatch<React.SetStateAction<Track | null>>
  trackIndex: number
  setTrackIndex: React.Dispatch<React.SetStateAction<number>>
  nextTrack: () => void
  previousTrack: () => void
  tracks: Track[]
  queueVisibility: boolean
  setQueueVisibility: React.Dispatch<React.SetStateAction<boolean>>
}

type PlaystateContextType = {
  audio: HTMLAudioElement | null
  isPlaying: boolean
  isReady: boolean
  currentTime: number
  duration: number
}

/**
 * The player context holds setters and values for the
 * currently playing media track.
 */
export const PlayerContext = React.createContext<PlayerContextType | undefined>(
  undefined,
)

/**
 * The playstate context holds the audio element and play state (time, play/pause, ...)
 */
const PlaystateContext = React.createContext<PlaystateContextType | undefined>(
  undefined,
)

export function PlayTrackButton({ track }: { track: Track }) {
  const { tracks, replaceCurrentQueue } = useQueue()
  const player = usePlayer()

  const clickHandler = () => {
    const currentIndex = player?.trackIndex || 0
    if (tracks.find((item) => track.uid === item.uid)) {
      const index = tracks.findIndex((item) => track.uid === item.uid)
      player?.setTrackIndex(index)
    } else {
      if (tracks.length === 0) {
        replaceCurrentQueue([track])
        player?.setTrackIndex(0)
      } else {
        tracks.splice(currentIndex + 1, 0, track)
        replaceCurrentQueue(tracks)
        player?.setTrackIndex(currentIndex + 1)
      }
    }
  }

  return (
    <Button onClick={clickHandler}>
      <PlayIcon />
    </Button>
  )
}

/**
 * The player provider provides the player and playstate contexts and renders an (invisible) audio element.
 * It also implements basic logic: Set audio element src on track change, change position on mark change, etc.
 */
export function PlayerProvider({ children }: PropsWithChildren) {
  const [didMount, setDidMount] = useState(false)
  const { tracks } = useQueue()
  const [track, setTrack] = useState<Track | null>(tracks.at(0) || null)
  const [trackIndex, setTrackIndex] = useState(0)
  const [queueVisibility, setQueueVisibility] = useState(false)

  const src = track ? track.src : ''
  const { audio, element, ...state } = useAudioElement({ src })

  useEffect(() => {
    if (tracks.at(trackIndex)) {
      setTrack(tracks.at(trackIndex) || null)
    } else if (tracks.length === 0 && audio) {
      setTrack(null)
    }
  }, [tracks, trackIndex, audio])

  useEffect(() => {
    if (!audio) return

    const pos = 0
    audio.currentTime = pos
    console.log(didMount, audio.src)
    if (didMount) {
      audio.load()
      audio.play()
    }
    setDidMount(true)
  }, [audio, track, didMount])

  function nextTrack() {
    if (trackIndex + 1 < tracks.length) {
      setTrackIndex(trackIndex + 1)
    } else setTrackIndex(0)
  }

  function previousTrack() {
    if (trackIndex - 1 < 0) {
      setTrackIndex(0)
    } else setTrackIndex(trackIndex - 1)
  }

  const playerContext = useMemo(
    () => ({
      track,
      setTrack,
      trackIndex,
      setTrackIndex,
      nextTrack,
      previousTrack,
      tracks,
      queueVisibility,
      setQueueVisibility,
    }),
    [track, trackIndex, tracks, queueVisibility],
  )

  const playstateContext = useMemo(
    () => ({
      ...state,
      audio,
    }),
    [audio, state],
  )

  return (
    <PlayerContext.Provider value={playerContext}>
      <PlaystateContext.Provider value={playstateContext}>
        {element}
        {children}
      </PlaystateContext.Provider>
    </PlayerContext.Provider>
  )
}

/**
 * Use the player context.
 * @return {object} {  track,
      setTrack,
      trackIndex,
      setTrackIndex,
      nextTrack,
      previousTrack,
      tracks, }
 */
export function usePlayer() {
  const context = useContext(PlayerContext)
  return context
}

/**
 * Use the playstate context.
 * @return {object} { audio: HTMLMediaElement, currentTime, duration, canplay, playing }
 */
export function usePlaystate() {
  const context = useContext(PlaystateContext)
  return context
}

function useRerender() {
  const [, setRerender] = useState(0)
  return function () {
    setRerender((counter) => {
      return counter + 1
    })
  }
}

function useAudioElement({ src }: { src: string | null }) {
  const ref = useRef<HTMLAudioElement | null>(null)
  const rerender = useRerender()

  const element = React.useMemo(
    () => <audio autoPlay={false} style={{ display: 'none' }} ref={ref} />,
    [],
  )

  const audio = ref.current

  useEffect(() => {
    if (!audio || !src) return
    audio.src = src
  }, [audio, src])

  useEffect(() => {
    if (!audio) return

    // In paused state render whenever the handler is triggered.
    // In playing state update every 500ms
    let interval: number | null = null
    function updateState() {
      if (audio?.paused) {
        if (interval) {
          clearInterval(interval)
          interval = null
        }
        rerender()
      } else if (!interval) {
        interval = window.setInterval(rerender, 500)
        rerender()
      }
    }

    audio.addEventListener('pause', updateState)
    audio.addEventListener('play', updateState)
    audio.addEventListener('timeupdate', updateState)
    audio.addEventListener('canplay', updateState)
    audio.addEventListener('durationchange', updateState)

    return () => {
      if (interval) clearInterval(interval)
      if (!audio) return
      audio.removeEventListener('pause', updateState)
      audio.removeEventListener('play', updateState)
      audio.removeEventListener('timeupdate', updateState)
      audio.removeEventListener('canplay', updateState)
      audio.removeEventListener('durationchange', updateState)
    }
  }, [audio, rerender])

  let state
  if (!audio) {
    state = {
      isPlaying: false,
      isReady: false,
      currentTime: 0,
      duration: 0,
    }
  } else {
    state = {
      isPlaying: !audio.paused,
      isReady: audio.readyState > 2,
      currentTime: audio.currentTime || 0,
      duration: audio.duration || 0,
    }
  }

  return {
    element,
    audio,
    ...state,
  }
}

export default function Player() {
  const player = usePlayer()
  const state = usePlaystate()
  const [draggingPos, setDraggingPos] = React.useState<number | null>(null)
  const audio = state?.audio

  function togglePlay() {
    if (!audio) return
    if (state.isPlaying) audio.pause()
    else if (state.isReady) {
      audio.load()
      audio.play()
    }
  }

  let posPercent = 0
  if (state?.currentTime) {
    posPercent = state.currentTime / state.duration
  }

  function setPosPercent(value: number) {
    if (!state?.duration) return
    const nextTime = state.duration * value
    if (audio) {
      audio.currentTime = nextTime
    }
  }

  const displayTime = draggingPos
    ? (state?.duration || 0) * draggingPos
    : state?.currentTime
  return (
    <div className="flex flex-col container py-2  text-white z-50">
      <div className="flex flex-col">
        <div className="flex flex-row justify-between space-x-4">
          <div className="flex space-x-1">
            <IconButton
              onClickCapture={player?.previousTrack}
              icon={<TrackPreviousIcon />}
              tooltip="previous"
            />
            <IconButton
              onClickCapture={togglePlay}
              icon={state?.isPlaying ? <PauseIcon /> : <PlayIcon />}
              tooltip="play"
            />

            <IconButton
              onClickCapture={player?.nextTrack}
              icon={<TrackNextIcon />}
              tooltip="next"
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="text-xs">{formatDuration(displayTime || 0)}</div>

            <Timeslider
              duration={state?.duration || 0}
              pos={posPercent}
              onChange={setPosPercent}
              onDraggingChange={setDraggingPos}
            />

            <div className="text-xs ">
              {formatDuration(state?.duration || 0)}
            </div>
          </div>
          <div className="flex items-center truncate">
            <p>{player?.track?.title}</p>
          </div>
          <IconButton
            icon={<ListBulletIcon />}
            tooltip={player?.queueVisibility ? 'hide queue' : 'show queue'}
            label={'show Queue'}
            onClick={() =>
              player?.setQueueVisibility(player.queueVisibility ? false : true)
            }
          />
        </div>
      </div>
    </div>
  )
}

interface TimesliderProps {
  pos: number
  duration: number
  onChange: (value: number) => void
  onDraggingChange: (value: number) => void
}

function Timeslider({
  pos,
  duration,
  onChange,
  onDraggingChange,
}: TimesliderProps) {
  const [dragging, setDragging] = useState(false)
  const [draggingValue, setDraggingValue] = useState<number | null>(null)

  let value
  if (dragging && draggingValue) value = draggingValue
  else value = pos * 100
  useEffect(() => {}, [draggingValue])
  return (
    <>
      <input
        min={0}
        max={100}
        type="range"
        value={pos * 100}
        onDragStart={onChangeStart}
        onDragEnd={(e) => onChangeEnd(Number(e.currentTarget.value))}
        onChange={(e) => {
          onSliderChange(Number(e.currentTarget.value))
        }}
      />
    </>
  )
  function onChangeStart() {
    setDragging(true)
  }

  function onChangeEnd(value: number) {
    if (!dragging) return
    setDragging(false)
    setPlayerPos(value)
    if (onDraggingChange) onDraggingChange(0)
  }

  function setPlayerPos(value: number) {
    value = (value || 0) / 100
    if (value !== pos) onChange(value)
  }

  function onSliderChange(value: number) {
    if (dragging) {
      setDraggingValue(value)
      if (onDraggingChange) onDraggingChange(value / 100)
    } else {
      setPlayerPos(value)
    }
  }
}

export function formatDuration(secs: number) {
  if (!secs) secs = 0
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs - h * 3600) / 60)
  const s = Math.floor(secs - h * 3600 - m * 60)
  if (h) return `${pad(h)}:${pad(m)}:${pad(s)}`
  return `${pad(m)}:${pad(s)}`
}

function pad(num: number) {
  if (String(num).length === 1) return '0' + num
  else return '' + num
}
