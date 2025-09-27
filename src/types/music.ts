export type Track = {
  id: string
  file?: File
  url: string
  title: string
  artist: string
  album: string
  duration: number
  coverDataUrl?: string
  trackNo?: number
  year?: number
  importedAt: number
}

export type Album = {
  id: string
  title: string
  artist: string
  year?: number
  coverDataUrl?: string
  tracks: string[]
}

export type PlayerState = {
  currentTrackId?: string
  isPlaying: boolean
  currentTime: number
  volume: number
  rate: number
}

export type QueueItem = {
  id: string
  trackId: string
  addedAt: number
}

export type ViewMode = 'carousel' | 'grid'
export type CollectionTab = 'albums' | 'playlists'

export type SortOrder = 'title' | 'artist' | 'year' | 'added'
