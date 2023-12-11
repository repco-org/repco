import { useContext, useEffect, useState } from 'react'
import { LocalstorageContexts } from '../../lib/localstorage-contexts'

export interface Track {
  uid: string
  title: string
  description?: string
  src: string
  contentItemUid?: string
}

export interface Playlist {
  id: string
  tracks: Track[]
  description?: string
}

export function usePlaylists() {
  const context =
    LocalstorageContexts.getInstance().getMapContext<Playlist>('playlists')
  if (!context) {
    throw new Error('No store context found')
  }
  const [playlists, setPlaylists] = useState<Playlist[]>()
  const { state, dispatch } = useContext(context)
  const { error, store } = state as {
    error: string
    store: Map<string, Playlist>
  }

  useEffect(() => {
    setPlaylists(Array.from(store.values()))
  }, [error, state, store])

  function createPlaylist(
    name: string | undefined,
    data?: Playlist | undefined,
  ) {
    if (name === undefined) return
    dispatch({
      type: 'CREATE',
      payload: {
        id: name,
        data: {
          id: name,
          tracks: data?.tracks || [],
          description: data?.description,
        },
      },
    })
  }

  function updatePlaylist(name: string, data: Playlist) {
    dispatch({
      type: 'UPDATE',
      payload: { id: name, data },
    })
  }

  function deletePlaylist(name: string) {
    dispatch({
      type: 'DELETE',
      payload: { id: name },
    })
  }

  function usePlaylist(name: string) {
    function addTrack(track: Track) {
      const playlist = store.get(name) || { tracks: [] }
      if (playlist.tracks.find((item) => item.uid === track.uid)) return
      dispatch({
        type: 'UPDATE',
        payload: {
          id: name,
          data: {
            id: name,
            tracks: [...playlist.tracks, track],
          },
        },
      })
    }
    function removeTrack(uid: string) {
      const tracks = store.get(name)?.tracks || []

      dispatch({
        type: 'UPDATE',
        payload: {
          id: name,
          data: {
            id: name,
            tracks: tracks.filter((t) => t.uid !== uid),
          },
        },
      })
    }

    const [tracks, setTracks] = useState<Track[]>()
    useEffect(() => {
      if (error) {
        console.error(error)
      }
      setTracks(store.get(name)?.tracks || [])
      // check if one can remove dependence array
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state])

    return { addTrack, removeTrack, tracks } as const
  }

  return {
    playlists,
    usePlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    error,
  } as const
}
