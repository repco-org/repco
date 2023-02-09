import React, {
  PropsWithChildren,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  PauseIcon,
  PlayIcon,
  TrackNextIcon,
  TrackPreviousIcon,
} from '@radix-ui/react-icons'
import { Track } from '~/lib/usePlaylists'
import { useQueue } from '~/lib/usePlayQueue'
import { Button } from '../ui/primitives/Button'

function trackHeadline({ track }: { track: Track }) {
  if (!track) return null
  let headline = track.title || track.src || undefined
  // Remove html highlighting tags from title display in player
  headline = headline?.replace(/(<([^>]+)>)/gi, '')
  return headline
}

type PlayerContext = {
  track: Track | null
  setTrack: React.Dispatch<React.SetStateAction<Track | null>>
  trackIndex: number
  setTrackIndex: React.Dispatch<React.SetStateAction<number>>
  nextTrack: () => void
  previousTrack: () => void
  tracks: Track[]
}

type PlaystateContext = {
  audio: HTMLAudioElement | null
  isPlaying: boolean
  isReady: boolean
  currentTime: number
  duration: number
}

/**
 * The player context holds setters and values for the
 * currently playing media track and mark (region).
 */
export const PlayerContext = React.createContext<PlayerContext | undefined>(
  undefined,
)

/**
 * The playstate context holds the audio element and play state (time, play/pause, ...)
 */
const PlaystateContext = React.createContext<PlaystateContext | undefined>(
  undefined,
)

/**
 * The player provider provides the player and playstate contexts and renders an (invisible) audio element.
 * It also implements basic logic: Set audio element src on track change, change position on mark change, etc.
 */
export function PlayerProvider({ children }: PropsWithChildren) {
  const [didMount, setDidMount] = useState(false)
  const { tracks } = useQueue()
  const [track, setTrack] = useState<Track | null>(tracks.at(0) || null)
  const [trackIndex, setTrackIndex] = useState(0)

  const src = track ? track.src : null
  const { audio, element, ...state } = useAudioElement({ src })

  useEffect(() => {
    if (tracks.at(trackIndex)) {
      setTrack(tracks.at(trackIndex) || null)
    }
  }, [tracks, trackIndex])

  useEffect(() => {
    if (!audio || !track) return
    let pos = 0
    audio.currentTime = pos
    if (didMount) {
      audio.play()
    }
    setDidMount(true)
  }, [audio, track])

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
    }),
    [track, trackIndex, tracks],
  )

  const playstateContext = useMemo(
    () => ({
      ...state,
      audio,
    }),
    [audio, state.currentTime, state.duration, state.isPlaying, state.isReady],
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
  const [rerender, setRerender] = useState(0)
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

  useLayoutEffect(() => {
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
  }, [audio])

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
    else if (state.isReady) audio.play()
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
    <div className="flex flex-col py-2 px-4 bg-sky-500  text-white z-50">
      <div className="flex flex-col">
        <div className="flex flex-row space-x-4">
          <div>
          <Button onClickCapture={player?.previousTrack}>
            <TrackPreviousIcon />
          </Button>
          <Button onClickCapture={togglePlay}>
            {state?.isPlaying ? <PauseIcon /> : <PlayIcon />}
          </Button>
          <Button onClickCapture={player?.nextTrack}>
            {' '}
            <TrackNextIcon />
          </Button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs">{formatDuration(displayTime || 0)}</div>

            <Timeslider
              duration={state?.duration || 0}
              pos={posPercent}
              onChange={setPosPercent}
              onDraggingChange={setDraggingPos}
            />

            <div className="text-xs">
              {formatDuration(state?.duration || 0)}
            </div>
          </div>
          <div className="flex items-center">
            <h3>{player?.track?.title}</h3>
          </div>
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
