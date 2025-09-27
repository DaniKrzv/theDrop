import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type {
  Album,
  CollectionTab,
  PlayerState,
  QueueItem,
  SortOrder,
  Track,
  ViewMode,
} from '@/types/music'
import { createId } from '@/utils/ids'

const UNKNOWN_ALBUM = 'Album inconnu'
const UNKNOWN_ARTIST = 'Artiste inconnu'

const normalizeText = (value?: string) => value?.trim() || ''

const albumKey = (artist: string, title: string) => `${artist.toLowerCase()}::${title.toLowerCase()}`

export type LibraryState = {
  tracks: Record<string, Track>
  albums: Record<string, Album>
}

export type UIState = {
  viewMode: ViewMode
  sortOrder: SortOrder
  filter: string
  collectionTab: CollectionTab
}

export type QueueState = {
  items: QueueItem[]
}

export type MusicStore = {
  library: LibraryState
  player: PlayerState
  queue: QueueState
  ui: UIState
  setViewMode: (mode: ViewMode) => void
  setSortOrder: (order: SortOrder) => void
  setFilter: (value: string) => void
  setCollectionTab: (tab: CollectionTab) => void
  addTracks: (entries: Omit<Track, 'id'>[]) => void
  removeTrack: (trackId: string) => void
  play: (trackId: string) => void
  pause: () => void
  togglePlayPause: () => void
  seek: (time: number) => void
  setCurrentTime: (time: number) => void
  setVolume: (volume: number) => void
  setRate: (rate: number) => void
  next: () => void
  previous: () => void
  enqueue: (trackId: string) => void
  enqueueAlbum: (albumId: string) => void
  removeFromQueue: (queueItemId: string) => void
  moveInQueue: (sourceIndex: number, destinationIndex: number) => void
  clearQueue: () => void
}

const initialState: Pick<MusicStore, 'library' | 'player' | 'queue' | 'ui'> = {
  library: {
    tracks: {},
    albums: {},
  },
  player: {
    currentTrackId: undefined,
    isPlaying: false,
    currentTime: 0,
    volume: 0.85,
    rate: 1,
  },
  queue: {
    items: [],
  },
  ui: {
    viewMode: 'carousel',
    sortOrder: 'added',
    filter: '',
    collectionTab: 'albums',
  },
}

const stripFileBeforePersist = (tracks: Record<string, Track>) => {
  const result: Record<string, Track> = {}
  Object.entries(tracks).forEach(([id, track]) => {
    const { file: _file, ...rest } = track
    result[id] = rest as Track
  })
  return result
}

const sortAlbumTracks = (album: Album, tracks: Record<string, Track>) => {
  album.tracks.sort((a, b) => {
    const trackA = tracks[a]
    const trackB = tracks[b]
    if (!trackA || !trackB) return 0
    if (trackA.trackNo && trackB.trackNo) {
      return trackA.trackNo - trackB.trackNo
    }
    return trackA.title.localeCompare(trackB.title)
  })
}

export const useMusicStore = create<MusicStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      setViewMode: (mode) => set({ ui: { ...get().ui, viewMode: mode } }),
      setSortOrder: (order) => set({ ui: { ...get().ui, sortOrder: order } }),
      setFilter: (value) => set({ ui: { ...get().ui, filter: value } }),
      setCollectionTab: (tab) => set({ ui: { ...get().ui, collectionTab: tab } }),
      addTracks: (entries) => {
        if (!entries.length) return
        set((state) => {
          const tracks = { ...state.library.tracks }
          const albums = { ...state.library.albums }

          entries.forEach((entry) => {
            const artist = normalizeText(entry.artist) || UNKNOWN_ARTIST
            const albumTitle = normalizeText(entry.album) || UNKNOWN_ALBUM
            const id = createId()
            const track: Track = {
              ...entry,
              id,
              artist,
              album: albumTitle,
              importedAt: Date.now(),
            }

            tracks[id] = track
            const key = albumKey(artist, albumTitle)
            const existing = albums[key]
            if (!existing) {
              albums[key] = {
                id: key,
                title: albumTitle,
                artist,
                year: track.year,
                coverDataUrl: track.coverDataUrl,
                tracks: [id],
              }
            } else {
              if (!existing.tracks.includes(id)) {
                existing.tracks = [...existing.tracks, id]
              }
              if (!existing.coverDataUrl && track.coverDataUrl) {
                existing.coverDataUrl = track.coverDataUrl
              }
              if (!existing.year && track.year) {
                existing.year = track.year
              }
            }
            sortAlbumTracks(albums[key], tracks)
          })

          return {
            library: {
              tracks,
              albums,
            },
          }
        })
      },
      removeTrack: (trackId) => {
        set((state) => {
          const tracks = { ...state.library.tracks }
          const albums = { ...state.library.albums }
          const queues = state.queue.items.filter((item) => item.trackId !== trackId)

          const track = tracks[trackId]
          if (!track) return state
          if (track.url) {
            URL.revokeObjectURL(track.url)
          }
          delete tracks[trackId]
          const key = albumKey(track.artist, track.album)
          const album = albums[key]
          if (album) {
            album.tracks = album.tracks.filter((id) => id !== trackId)
            if (album.tracks.length === 0) {
              delete albums[key]
            }
          }

          return {
            library: { tracks, albums },
            queue: { items: queues },
            player:
              state.player.currentTrackId === trackId
                ? { ...state.player, currentTrackId: undefined, isPlaying: false, currentTime: 0 }
                : state.player,
          }
        })
      },
      play: (trackId) => {
        set((state) => ({
          player: {
            ...state.player,
            currentTrackId: trackId,
            isPlaying: true,
          },
        }))
      },
      pause: () => {
        set((state) => ({
          player: {
            ...state.player,
            isPlaying: false,
          },
        }))
      },
      togglePlayPause: () => {
        const { player } = get()
        if (!player.currentTrackId) return
        set({ player: { ...player, isPlaying: !player.isPlaying } })
      },
      seek: (time) => {
        set((state) => ({
          player: {
            ...state.player,
            currentTime: time,
          },
        }))
      },
      setCurrentTime: (time) => {
        set((state) => ({
          player: {
            ...state.player,
            currentTime: time,
          },
        }))
      },
      setVolume: (volume) => {
        set((state) => ({
          player: {
            ...state.player,
            volume,
          },
        }))
      },
      setRate: (rate) => {
        set((state) => ({
          player: {
            ...state.player,
            rate,
          },
        }))
      },
      enqueue: (trackId) => {
        set((state) => ({
          queue: {
            items: [
              ...state.queue.items,
              {
                id: createId(),
                trackId,
                addedAt: Date.now(),
              },
            ],
          },
        }))
      },
      enqueueAlbum: (albumId) => {
        const { library } = get()
        const album = library.albums[albumId]
        if (!album) return
        set((state) => ({
          queue: {
            items: [
              ...state.queue.items,
              ...album.tracks.map((trackId) => ({
                id: createId(),
                trackId,
                addedAt: Date.now(),
              })),
            ],
          },
        }))
      },
      removeFromQueue: (queueItemId) => {
        set((state) => ({
          queue: {
            items: state.queue.items.filter((item) => item.id !== queueItemId),
          },
        }))
      },
      moveInQueue: (sourceIndex, destinationIndex) => {
        set((state) => {
          const items = [...state.queue.items]
          const [removed] = items.splice(sourceIndex, 1)
          if (!removed) return state
          items.splice(destinationIndex, 0, removed)
          return { queue: { items } }
        })
      },
      clearQueue: () => set({ queue: { items: [] } }),
      next: () => {
        const state = get()
        const { currentTrackId } = state.player
        if (!currentTrackId) {
          if (state.queue.items.length > 0) {
            const nextItem = state.queue.items[0]
            set({ player: { ...state.player, currentTrackId: nextItem.trackId, isPlaying: true, currentTime: 0 } })
          }
          return
        }

        const queueIndex = state.queue.items.findIndex((item) => item.trackId === currentTrackId)
        if (queueIndex >= 0 && queueIndex < state.queue.items.length - 1) {
          const nextItem = state.queue.items[queueIndex + 1]
          set({
            player: {
              ...state.player,
              currentTrackId: nextItem.trackId,
              isPlaying: true,
              currentTime: 0,
            },
          })
          return
        }

        const track = state.library.tracks[currentTrackId]
        if (!track) return
        const key = albumKey(track.artist, track.album)
        const album = state.library.albums[key]
        if (!album) return
        const trackIndex = album.tracks.indexOf(currentTrackId)
        const nextAlbumTrack = album.tracks[trackIndex + 1]
        if (nextAlbumTrack) {
          set({
            player: {
              ...state.player,
              currentTrackId: nextAlbumTrack,
              isPlaying: true,
              currentTime: 0,
            },
          })
        }
      },
      previous: () => {
        const state = get()
        const { currentTrackId } = state.player
        if (!currentTrackId) return

        const queueIndex = state.queue.items.findIndex((item) => item.trackId === currentTrackId)
        if (queueIndex > 0) {
          const prevItem = state.queue.items[queueIndex - 1]
          set({
            player: {
              ...state.player,
              currentTrackId: prevItem.trackId,
              isPlaying: true,
              currentTime: 0,
            },
          })
          return
        }

        const track = state.library.tracks[currentTrackId]
        if (!track) return
        const key = albumKey(track.artist, track.album)
        const album = state.library.albums[key]
        if (!album) return
        const trackIndex = album.tracks.indexOf(currentTrackId)
        const previousAlbumTrack = album.tracks[trackIndex - 1]
        if (previousAlbumTrack) {
          set({
            player: {
              ...state.player,
              currentTrackId: previousAlbumTrack,
              isPlaying: true,
              currentTime: 0,
            },
          })
        }
      },
    }),
    {
      name: 'thedrop-music-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        library: {
          tracks: stripFileBeforePersist(state.library.tracks),
          albums: state.library.albums,
        },
        queue: state.queue,
        ui: state.ui,
        player: {
          currentTrackId: state.player.currentTrackId,
          isPlaying: false,
          currentTime: 0,
          volume: state.player.volume,
          rate: state.player.rate,
        },
      }),
    },
  ),
)

export const librarySelectors = {
  tracks: (state: MusicStore) => state.library.tracks,
  albumsArray: (state: MusicStore) => Object.values(state.library.albums),
}

export const playerSelectors = {
  currentTrack: (state: MusicStore) =>
    state.player.currentTrackId ? state.library.tracks[state.player.currentTrackId] : undefined,
  state: (state: MusicStore) => state.player,
}

export const queueSelectors = {
  itemsWithTrack: (state: MusicStore) =>
    state.queue.items
      .map((item) => ({ ...item, track: state.library.tracks[item.trackId] }))
      .filter((item) => Boolean(item.track)),
}

export const resetMusicStore = () => {
  useMusicStore.setState(initialState)
  ;(useMusicStore as typeof useMusicStore & {
    persist?: { clearStorage: () => void }
  }).persist?.clearStorage()
}
