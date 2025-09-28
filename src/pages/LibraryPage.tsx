import { useEffect, useMemo, useState } from 'react'

import { LibraryHeader } from '@/components/library/LibraryHeader'
import { AlbumCarousel3D } from '@/components/library/AlbumCarousel3D'
import { AlbumGrid } from '@/components/library/AlbumGrid'
import { librarySelectors, useMusicStore } from '@/store/useMusicStore'
import type { Album, SortOrder } from '@/types/music'
import { CloudDownload, Loader2 } from 'lucide-react'
import { useTuskyLibrary } from '@/trusky/useTuskyLibrary'
import { useTrusky } from '@/trusky/TruskyProvider'

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
  // Avoid returning a fresh array from a selector (can trigger getSnapshot warnings)
  const albumsObj = useMusicStore((state) => state.library.albums)
  const albums = useMemo(() => Object.values(albumsObj), [albumsObj])
  const tracks = useMusicStore(librarySelectors.tracks)
  const viewMode = useMusicStore((state) => state.ui.viewMode)
  const sortOrder = useMusicStore((state) => state.ui.sortOrder)
  const filter = useMusicStore((state) => state.ui.filter)
  const collectionTab = useMusicStore((state) => state.ui.collectionTab)
  const setViewMode = useMusicStore((state) => state.setViewMode)
  const setSortOrder = useMusicStore((state) => state.setSortOrder)
  const setFilter = useMusicStore((state) => state.setFilter)
  const setCollectionTab = useMusicStore((state) => state.setCollectionTab)
  const play = useMusicStore((state) => state.play)
  const addTracks = useMusicStore((state) => state.addTracks)
  const { isConnected, isConnecting } = useTrusky()
  const { listAlbums, fetchAlbumTracks } = useTuskyLibrary()
  const [remoteAlbums, setRemoteAlbums] = useState<{ vaultId: string; albumFolderId: string; title: string; trackCount: number }[]>([])
  const [syncingVault, setSyncingVault] = useState<string | null>(null)
  const [downloadProgress, setDownloadProgress] = useState<{ [vaultId: string]: { current: number; total: number } }>({})

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
    const first = filteredAlbums[0]
    if (first?.id !== activeAlbum?.id) {
      setActiveAlbum(first)
    }
  }, [filteredAlbums, activeAlbum?.id])

  // Load Tusky albums on mount if connected
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      if (!isConnected) return
      try {
        const items = await listAlbums()
        if (!cancelled) {
          setRemoteAlbums(items)
        }
      } catch {
        // ignore
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [isConnected, listAlbums])

  const importFromTusky = async (vaultId: string, albumFolderId?: string) => {
    if (syncingVault) return
    setSyncingVault(vaultId)
    setDownloadProgress(prev => ({ ...prev, [vaultId]: { current: 0, total: 0 } }))
    
    try {
      const parsedTracks = await fetchAlbumTracks(vaultId, albumFolderId)
      addTracks(parsedTracks)
      
      // Clear progress after successful import
      setDownloadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[vaultId]
        return newProgress
      })
    } catch (error) {
      console.error('Failed to import album from Tusky:', error)
    } finally {
      setSyncingVault(null)
    }
  }

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

  const getProgressPercentage = (vaultId: string) => {
    const progress = downloadProgress[vaultId]
    if (!progress || progress.total === 0) return 0
    return Math.round((progress.current / progress.total) * 100)
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-10">
      <div className="w-full">
        <LibraryHeader
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          collectionTab={collectionTab}
          onCollectionTabChange={setCollectionTab}
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          filter={filter}
          onFilterChange={setFilter}
        />
      </div>

      <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-300">Tusky</p>
            {isConnected ? (
              <p className="text-xs text-slate-400">{remoteAlbums.length} album{remoteAlbums.length !== 1 ? 's' : ''} détecté(s)</p>
            ) : (
              <p className="text-xs text-slate-400">{isConnecting ? 'Connexion à Tusky…' : 'Connectez-vous à Tusky pour synchroniser votre bibliothèque'}</p>
            )}
          </div>
        </div>
        {isConnected && remoteAlbums.length > 0 && (
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {remoteAlbums.map((ra) => {
              const isDownloading = syncingVault === ra.vaultId
              const progress = getProgressPercentage(ra.vaultId)
              
              return (
                <button
                  key={ra.vaultId}
                  onClick={() => importFromTusky(ra.vaultId, ra.albumFolderId)}
                  disabled={Boolean(syncingVault)}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-left hover:bg-white/20 disabled:opacity-50"
                >
                  <div className="min-w-0 pr-3">
                    <div className="truncate text-sm font-medium text-white">{ra.title}</div>
                    <div className="truncate text-xs text-slate-300">
                      {isDownloading ? `Téléchargement... ${progress}%` : `${ra.trackCount} pistes`}
                    </div>
                    {isDownloading && (
                      <div className="mt-1 h-1 w-full rounded-full bg-slate-600">
                        <div 
                          className="h-1 rounded-full bg-accent transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  {isDownloading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <CloudDownload className="h-4 w-4 text-slate-200" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {collectionTab === 'playlists' ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-center text-slate-300">
          <p className="text-lg font-semibold text-white">Playlists</p>
          <p className="mt-1 max-w-md text-sm text-slate-300">
            Créez des files d&apos;attente persistantes depuis vos albums. Cette zone pourra accueillir vos sélections
            enregistrées.
          </p>
        </div>
      ) : viewMode === 'carousel' ? (
        <div className="relative flex w-full items-center justify-center">
          <AlbumCarousel3D
            albums={filteredAlbums}
            onActiveChange={handleActiveChange}
            onAlbumClick={(album) => handlePlayAlbum(album.id)}
          />
        </div>
      ) : (
        <AlbumGrid albums={filteredAlbums} tracks={tracks} onPlayAlbum={handlePlayAlbum} />
      )}
    </div>
  )
}

export default LibraryPage
