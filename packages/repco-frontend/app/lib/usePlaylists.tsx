import { useContext, useEffect, useState } from 'react'
import { ContextManager } from '~/lib/contextManager'

interface Track {
  uid: string
  title: string
}

export interface Playlist {
  tracks: Track[]
}

export function usePlaylists() {
  const contextManager = ContextManager.getInstance()
  const context = contextManager.getContext<Playlist>('playlists')
  if (!context) {
    throw new Error('No store context found')
  }
  const [playlists, setPlaylists] = useState<string[]>()
  const { state, dispatch } = useContext(context)
  const { error, store } = state

  useEffect(() => {
    if (error) {
      console.error(error)
    }
    setPlaylists(() => {
      return store instanceof Map
        ? Array.from(store.keys())
        : store instanceof Array
        ? store.map((p) => p.id)
        : undefined
    })
  }, [state])

  function newPlaylist(name: string) {
    dispatch({
      type: 'CREATE',
      payload: { id: name, data: { tracks: [] } },
    })
  }

  function deletePlaylist(name: string) {
    dispatch({
      type: 'DELETE',
      payload: { id: name, data: { tracks: [] } },
    })
  }

  function getPlaylist(name: string) {
    function addTrack(uid: string, title: string) {
      let tracks =
        (store instanceof Map
          ? store.get(name)?.tracks
          : store instanceof Array
          ? store.find((p) => p.id === name)?.data.tracks
          : []) || []
      dispatch({
        type: 'UPDATE',
        payload: {
          id: name,
          data: {
            tracks: [...tracks, { uid, title }],
          },
        },
      })
    }
    function removeTrack(uid: string) {
      let tracks =
        (store instanceof Map
          ? store.get(name)?.tracks
          : store instanceof Array
          ? store.find((p) => p.id === name)?.data.tracks
          : []) || []
      dispatch({
        type: 'UPDATE',
        payload: {
          id: name,
          data: {
            tracks: tracks.filter((t) => t.uid !== uid),
          },
        },
      })
    }
    function listTracks() {
      return (
        (store instanceof Map
          ? store.get(name)?.tracks
          : store instanceof Array
          ? store.find((p) => p.id === name)?.data.tracks
          : []) || []
      )
    }

    return [addTrack, removeTrack, listTracks] as const
  }

  return [playlists, getPlaylist, newPlaylist, deletePlaylist] as const
}
