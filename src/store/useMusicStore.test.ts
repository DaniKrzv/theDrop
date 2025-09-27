import { beforeEach, describe, expect, it } from 'vitest'

import { useMusicStore, resetMusicStore } from '@/store/useMusicStore'
import type { Track } from '@/types/music'

const createTrack = (overrides: Partial<Omit<Track, 'id'>> & { title: string }) => ({
  url: overrides.url ?? `blob:${Math.random().toString(36).slice(2)}`,
  artist: overrides.artist ?? 'Test Artist',
  album: overrides.album ?? 'Test Album',
  duration: overrides.duration ?? 200,
  coverDataUrl: overrides.coverDataUrl,
  trackNo: overrides.trackNo,
  year: overrides.year,
  importedAt: overrides.importedAt ?? Date.now(),
  file: overrides.file,
  title: overrides.title,
})

describe('useMusicStore', () => {
  beforeEach(() => {
    resetMusicStore()
  })

  it('ajoute des pistes et les groupe par album', () => {
    const addTracks = useMusicStore.getState().addTracks
    addTracks([
      createTrack({ title: 'Intro', trackNo: 1 }),
      createTrack({ title: 'Outro', trackNo: 2 }),
    ])

    const state = useMusicStore.getState()
    const tracks = Object.values(state.library.tracks)
    const albums = Object.values(state.library.albums)

    expect(tracks).toHaveLength(2)
    expect(albums).toHaveLength(1)
    expect(albums[0].tracks).toHaveLength(2)
    // préservation de l'ordre par numéro de piste
    const orderedTitles = albums[0].tracks.map((id) => state.library.tracks[id]?.title)
    expect(orderedTitles).toEqual(['Intro', 'Outro'])
  })

  it('gère la file et le réordonnancement', () => {
    const store = useMusicStore.getState()
    store.addTracks([
      createTrack({ title: 'A' }),
      createTrack({ title: 'B' }),
      createTrack({ title: 'C' }),
    ])
    const trackIds = Object.keys(useMusicStore.getState().library.tracks)
    store.enqueue(trackIds[0])
    store.enqueue(trackIds[1])
    store.enqueue(trackIds[2])

    store.moveInQueue(2, 0)
    const queueOrder = useMusicStore
      .getState()
      .queue.items.map((item) => item.trackId)
    expect(queueOrder[0]).toBe(trackIds[2])

    store.removeFromQueue(useMusicStore.getState().queue.items[1].id)
    expect(useMusicStore.getState().queue.items).toHaveLength(2)
  })

  it('passe au morceau suivant via la file ou l’album', () => {
    const store = useMusicStore.getState()
    store.addTracks([
      createTrack({ title: 'One', trackNo: 1 }),
      createTrack({ title: 'Two', trackNo: 2 }),
    ])

    const trackIds = Object.keys(useMusicStore.getState().library.tracks)
    store.enqueue(trackIds[1])
    store.play(trackIds[0])
    store.next()

    expect(useMusicStore.getState().player.currentTrackId).toBe(trackIds[1])

    useMusicStore.setState({ queue: { items: [] } })
    store.previous()
    expect(useMusicStore.getState().player.currentTrackId).toBe(trackIds[0])
  })
})
