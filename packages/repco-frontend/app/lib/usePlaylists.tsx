import { useEffect, useState } from 'react'

interface Track {
  uid: string
  title: string
}

interface Playlist {
  name: string
  tracks: Track[]
}

interface Item {
  key: string
  value: string[]
}

export function usePlaylists() {
  const [value, setValue] = useLocalStorage([], 'playlists')
  function listPlaylists() {
    return value
  }

  function newPlaylist(name: string) {
    const playlists = value
    if (playlists === undefined) {
      return
    }
    const newPlaylist = { name: name, tracks: [] }
    setValue([...playlists, newPlaylist])
  }
  function deletePlaylist(name: string) {
    const playlists = value
    const newPlaylists = playlists.filter(
      (playlist: any) => playlist.name !== name,
    )
    setValue('playlists', newPlaylists)
  }

  return [listPlaylists, newPlaylist, deletePlaylist]
}

export function usePlaylist() {
  function addTrack(playlist: string, uid: string) {
    const tracks = getStorage(playlist)
    const newTracks = [...tracks, uid]
    setStorage(playlist, JSON.stringify(newTracks))
  }
  function removeTrack(playlist: string, uid: string) {
    const tracks = getStorage(playlist)
    const newTracks = tracks.filter((track: string) => track !== uid)
    setStorage(playlist, JSON.stringify(newTracks))
  }
  function listTracks(playlist: string) {
    return getStorage(playlist)
  }

  return [addTrack, removeTrack, listTracks]
}

const useLocalStorage = (defaultValue = [], localStorageKey: string) => {
  const [value, setValue] = useState<Playlist[] | Track[]>()
  useEffect(() => {
    const localStorageItem = localStorage.getItem(localStorageKey)
    if (localStorageItem === null) setValue(defaultValue)
    else
      try {
        setValue(JSON.parse(localStorageItem))
      } catch (err) {
        setValue(defaultValue)
      }
  }, [localStorageKey])

  useEffect(() => {
    localStorage.setItem(localStorageKey, JSON.stringify(value))
  }, [value])

  return [value, setValue] as const
}
