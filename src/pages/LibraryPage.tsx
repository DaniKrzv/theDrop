import { useEffect, useMemo, useState } from 'react'

import { LibraryHeader } from '@/components/library/LibraryHeader'
import { AlbumCarousel3D } from '@/components/library/AlbumCarousel3D'
import { AlbumGrid } from '@/components/library/AlbumGrid'
import { AlbumMiniInfoBar } from '@/components/library/AlbumMiniInfoBar'
import { librarySelectors, useMusicStore } from '@/store/useMusicStore'
import type { Album, SortOrder } from '@/types/music'

const sortAlbums = (albums: Album[], sortOrder: SortOrder, importDates: Record<string, number>) => {
  const copy = [...albums]
  switch (sortOrder) {
    case 'title':
      return copy.sort((a, b) => a.title.localeCompare(b.title))
    case 'artist':
      return copy.sort((a, b) => a.artist.localeCompare(b.artist))
    case 'year':
      return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    case 'added':
    default:
      return copy.sort((a, b) => (importDates[b.id] ?? 0) - (importDates[a.id] ?? 0))
  }
}

export const LibraryPage = () => {
  const albums = useMusicStore(librarySelectors.albumsArray)
  const tracks = useMusicStore(librarySelectors.tracks)
  const viewMode = useMusicStore((state) => state.ui.viewMode)
  const sortOrder = useMusicStore((state) => state.ui.sortOrder)
  const filter = useMusicStore((state) => state.ui.filter)
  const collectionTab = useMusicStore((state) => state.ui.collectionTab)
  const setViewMode = useMusicStore((state) => state.setViewMode)
  const setSortOrder = useMusicStore((state) => state.setSortOrder)
  const setFilter = useMusicStore((state) => state.setFilter)
  const setCollectionTab = useMusicStore((state) => state.setCollectionTab)
  const enqueueAlbum = useMusicStore((state) => state.enqueueAlbum)
  const play = useMusicStore((state) => state.play)
  const player = useMusicStore((state) => state.player)
  const setRate = useMusicStore((state) => state.setRate)

  const derivedByAlbum = useMemo(() => {
    const imports: Record<string, number> = {}
    Object.values(tracks).forEach((track) => {
      const key = `${track.artist.toLowerCase()}::${track.album.toLowerCase()}`
      imports[key] = Math.max(imports[key] ?? 0, track.importedAt)
    })
    return { imports }
  }, [tracks])

  const filteredAlbums = useMemo(() => {
    const term = filter.trim().toLowerCase()
    const importMap = Object.fromEntries(albums.map((album) => [album.id, derivedByAlbum.imports[album.id] ?? 0]))
    const prepared = sortAlbums(albums, sortOrder, importMap)
    if (!term) return prepared
    return prepared.filter((album) =>
      [album.title, album.artist].some((value) => value.toLowerCase().includes(term)) ||
      album.tracks.some((trackId) => tracks[trackId]?.title?.toLowerCase().includes(term)),
    )
  }, [albums, filter, sortOrder, derivedByAlbum.imports, tracks])

  const [activeAlbum, setActiveAlbum] = useState<Album | undefined>(filteredAlbums[0])

  useEffect(() => {
    setActiveAlbum(filteredAlbums[0])
  }, [filteredAlbums])

  const handlePlayAlbum = (albumId: string) => {
    const album = filteredAlbums.find((item) => item.id === albumId)
    if (!album) return
    const firstTrackId = album.tracks[0]
    if (!firstTrackId) return
    play(firstTrackId)
  }

  const handleActiveChange = (album: Album) => {
    setActiveAlbum(album)
  }

  const playbackRate = player.rate

  return (
    <div className="flex flex-col gap-6">
      <LibraryHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        collectionTab={collectionTab}
        onCollectionTabChange={setCollectionTab}
        sortOrder={sortOrder}
        onSortChange={setSortOrder}
        filter={filter}
        onFilterChange={setFilter}
        playbackRate={playbackRate}
        onRateChange={setRate}
      />

      {collectionTab === 'playlists' ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-center text-slate-300">
          <p className="text-lg font-semibold text-white">Playlists</p>
          <p className="mt-1 max-w-md text-sm text-slate-300">
            Créez des files d&apos;attente persistantes depuis vos albums. Cette zone pourra accueillir vos sélections
            enregistrées.
          </p>
        </div>
      ) : viewMode === 'carousel' ? (
        <div className="relative">
          <AlbumCarousel3D
            albums={filteredAlbums}
            tracks={tracks}
            onActiveChange={handleActiveChange}
            onAlbumClick={(album) => handlePlayAlbum(album.id)}
          />
          <AlbumMiniInfoBar
            album={activeAlbum}
            tracks={tracks}
            onPlayAlbum={handlePlayAlbum}
            onEnqueueAlbum={enqueueAlbum}
          />
        </div>
      ) : (
        <AlbumGrid albums={filteredAlbums} tracks={tracks} onPlayAlbum={handlePlayAlbum} />
      )}
    </div>
  )
}

export default LibraryPage
