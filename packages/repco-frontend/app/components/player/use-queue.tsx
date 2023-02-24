import { useContext, useEffect, useState } from 'react'
import type { Entity } from '~/lib/localstorage-contexts'
import { LocalstorageContexts } from '~/lib/localstorage-contexts'
import type { Playlist, Track } from './use-playlists'

export function useQueue() {
  const context =
    LocalstorageContexts.getInstance().getListContext<Track>('queue')
  if (!context) {
    throw new Error('No store context found')
  }
  const [queue, setQueue] = useState<Array<Entity<Track>>>([])
  const { state, dispatch } = useContext(context)
  const { store, error } = state

  useEffect(() => {
    setQueue(store as Entity<Track>[])
  }, [state])

  function addTrack(data?: Track) {
    if (data === undefined) return
    dispatch({
      type: 'CREATE',
      payload: {
        id: data.uid,
        data,
      },
    })
  }

  function updateTrack(data: Track) {
    dispatch({
      type: 'UPDATE',
      payload: { id: data.uid, data },
    })
  }

  function deleteTrack(uid: string) {
    dispatch({
      type: 'DELETE',
      payload: { id: uid },
    })
  }

  function replaceCurrentQueue(queue: Array<Track>) {
    const payload = queue.map((item) => {
      return { id: item.uid, data: item }
    })
    dispatch({
      type: 'REPLACE',
      payload: payload,
    })
  }

  function loadPlaylistToQueue(playlist: Playlist) {
    replaceCurrentQueue(playlist.tracks)
  }

  const tracks = queue.map((item) => item.data)
  return {
    tracks,
    addTrack,
    updateTrack,
    deleteTrack,
    replaceCurrentQueue,
    loadPlaylistToQueue,
    error,
  } as const
}
