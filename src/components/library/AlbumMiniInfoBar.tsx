import { motion } from 'framer-motion'
import { Plus, Play } from 'lucide-react'

import type { Album, Track } from '@/types/music'

export type AlbumMiniInfoBarProps = {
  album?: Album
  tracks: Record<string, Track>
  onPlayAlbum?: (albumId: string) => void
  onEnqueueAlbum?: (albumId: string) => void
}

export const AlbumMiniInfoBar = ({ album, tracks, onPlayAlbum, onEnqueueAlbum }: AlbumMiniInfoBarProps) => {
  if (!album) return null

  const firstTrack = album.tracks[0] ? tracks[album.tracks[0]] : undefined

  return (
    <motion.div
      layout
      className="mt-6 flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200 shadow-soft"
    >
      <div>
        <p className="text-sm uppercase tracking-wide text-slate-300">Focus</p>
        <h3 className="text-2xl font-semibold text-white">{album.title}</h3>
        <p className="text-sm text-slate-300">{album.artist}</p>
        {firstTrack && <p className="text-xs text-slate-400">Ouvre avec : {firstTrack.title}</p>}
      </div>
      <div className="flex gap-3">
        {onPlayAlbum && (
          <button
            type="button"
            onClick={() => onPlayAlbum(album.id)}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2 font-semibold text-slate-950 transition hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <Play className="h-4 w-4" aria-hidden />
            Lecture
          </button>
        )}
        {onEnqueueAlbum && (
          <button
            type="button"
            onClick={() => onEnqueueAlbum(album.id)}
            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-semibold text-white transition hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Queue
          </button>
        )}
      </div>
    </motion.div>
  )
}
