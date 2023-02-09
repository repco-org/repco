import { useContext, useEffect, useState } from 'react'
import { ContextManager } from '~/lib/contextManager'
import type { Track } from './usePlaylists'
import { Entity } from '~/lib/contextManager'

export function useQueue() {
  const context =
    ContextManager.getInstance().getListContext<Track>('queue')
  if (!context) {
    throw new Error('No store context found')
  }
  const [queue, setQueue] = useState<Array<Entity<Track>>>([])
  const { state, dispatch } = useContext(context)
  const {store, error }  = state 


  useEffect(() => {
    setQueue(store as Entity<Track>[])
  }, [state])

  function addTrack(
    data?: Track,
  ) {
    if (data === undefined) return
    dispatch({
      type: 'CREATE',
      payload: {
        id: data.uid,
        data
      },
    })
  }
  
  function updateTrack(data: Track) {
    console.log('UPDATE',data)
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
 

  const tracks = queue.map((item) => item.data)
  return {
    tracks, addTrack,updateTrack,deleteTrack, error
 } as const
}
