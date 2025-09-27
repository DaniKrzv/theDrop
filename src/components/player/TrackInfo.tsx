import { Heart } from 'lucide-react'

import type { Track } from '@/types/music'

export type TrackInfoProps = {
  track?: Track
}

export const TrackInfo = ({ track }: TrackInfoProps) => {
  return (
    <section className="mt-6 flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-slate-200 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">En lecture</p>
          <h2 className="mt-2 max-w-xl text-3xl font-semibold text-white">{track?.title ?? 'Sélectionner un morceau'}</h2>
          <p className="mt-1 text-sm text-slate-300">{track?.artist ?? 'Artiste inconnu'}</p>
        </div>
        <button
          type="button"
          className="rounded-full border border-white/10 bg-white/10 p-3 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          aria-label="Ajouter aux favoris"
        >
          <Heart className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>Liquid glass • Mode vinyle</span>
        <span>•</span>
        <span>{track?.album ?? 'Lecture libre'}</span>
      </div>
    </section>
  )
}
