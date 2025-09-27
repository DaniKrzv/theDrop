import { motion } from 'framer-motion'

import type { Album, Track } from '@/types/music'
import { extractInitials, formatDuration, gradientFromString } from '@/utils/formatters'

export type AlbumGridProps = {
  albums: Album[]
  tracks: Record<string, Track>
  onPlayAlbum?: (albumId: string) => void
  onAlbumClick?: (album: Album) => void
}

export const AlbumGrid = ({ albums, tracks, onPlayAlbum, onAlbumClick }: AlbumGridProps) => {
  if (!albums.length) {
    return (
      <div className="grid min-h-[320px] place-items-center rounded-3xl border border-white/10 bg-white/5 text-sm text-slate-300">
        <div className="text-center">
          <p className="text-base font-semibold text-white">Bibliothèque vide</p>
          <p className="mt-1 text-xs text-slate-400">Importez vos fichiers .mp3 pour commencer.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {albums.map((album) => {
        const duration = album.tracks.reduce((total, trackId) => total + (tracks[trackId]?.duration || 0), 0)
        return (
          <motion.article
            key={album.id}
            layout
            whileHover={{ y: -8 }}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-slate-900/40 p-4 shadow-soft"
          >
            <button
              type="button"
              onClick={() => onAlbumClick?.(album)}
              className="absolute inset-0"
              aria-label={`Ouvrir ${album.title}`}
            >
              <span className="sr-only">Ouvrir {album.title}</span>
            </button>
            <div className="relative overflow-hidden rounded-2xl">
              {album.coverDataUrl ? (
                <img
                  src={album.coverDataUrl}
                  alt={`Pochette de ${album.title}`}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-48 w-full items-center justify-center text-3xl font-bold"
                  style={{ backgroundImage: gradientFromString(`${album.artist}-${album.title}`) }}
                >
                  {extractInitials(album.title)}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 via-black/10 to-transparent p-4">
                <div className="text-left">
                  <p className="text-sm font-semibold text-white">{album.title}</p>
                  <p className="text-xs text-slate-300">{album.artist}</p>
                </div>
                {onPlayAlbum && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      onPlayAlbum(album.id)
                    }}
                    className="rounded-full border border-white/20 bg-white/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white transition group-hover:bg-accent group-hover:text-slate-950"
                  >
                    Play
                  </button>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
              <span>{album.tracks.length} pistes</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </motion.article>
        )
      })}
    </div>
  )
}
