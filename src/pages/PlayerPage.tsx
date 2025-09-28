import { Pause, Play, SkipBack, SkipForward } from 'lucide-react'
import { VinylTurntable } from '@/components/player/VinylTurntable'
import { playerSelectors, useMusicStore } from '@/store/useMusicStore'
import useQueueItemsWithTrack from '@/hooks/useQueueItemsWithTrack'

export const PlayerPage = () => {
  const currentTrack = useMusicStore(playerSelectors.currentTrack)
  const playerState = useMusicStore(playerSelectors.state)
  const queueItems = useQueueItemsWithTrack()
  const play = useMusicStore((state) => state.play)
  const toggle = useMusicStore((state) => state.togglePlayPause)
  const next = useMusicStore((state) => state.next)
  const previous = useMusicStore((state) => state.previous)
  const seek = useMusicStore((state) => state.seek)

  const handleToggle = () => {
    if (!currentTrack) {
      const nextItem = queueItems[0]
      if (nextItem?.track) {
        play(nextItem.trackId)
        return
      }
    }
    toggle()
  }

  const duration = currentTrack?.duration ?? 0
  const current = Math.min(playerState.currentTime, duration)
  const percent = duration > 0 ? Math.max(0, Math.min(100, (current / duration) * 100)) : 0

  const formatTime = (secs: number) => {
    const s = Math.max(0, Math.floor(secs))
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, '0')}`
  }

  const handleBarClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    seek(ratio * duration)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft lg:flex-row">
        {/* Vinyl turntable retained */}
        <VinylTurntable track={currentTrack} isPlaying={playerState.isPlaying} />

        {/* Unified minimal info + progress + controls */}
        <div className="flex flex-1 flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 overflow-hidden rounded-xl border border-white/10 bg-white/10">
              {currentTrack?.coverDataUrl ? (
                <img src={currentTrack.coverDataUrl} alt="Cover" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-2xl font-semibold text-white">
                {currentTrack?.title || 'Aucun titre sélectionné'}
              </p>
              <p className="truncate text-base text-slate-300">{currentTrack?.artist || ''}</p>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-slate-300">
            <span className="w-12 text-xs tabular-nums">{formatTime(current)}</span>
            <div
              role="slider"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={current}
              onClick={handleBarClick}
              className="relative h-2 flex-1 cursor-pointer rounded-full bg-white/10"
            >
              <div className="absolute left-0 top-0 h-full rounded-full bg-white/30" style={{ width: `${percent}%` }} />
            </div>
            <span className="w-12 text-right text-xs tabular-nums">{duration ? `-${formatTime(duration - current)}` : '--:--'}</span>
          </div>

          <div className="mt-6 flex items-center justify-center gap-8">
            <button
              type="button"
              onClick={previous}
              className="rounded-full p-3 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="Piste précédente"
            >
              <SkipBack className="h-8 w-8" aria-hidden />
            </button>
            <button
              type="button"
              onClick={handleToggle}
              className="rounded-full p-3 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label={playerState.isPlaying ? 'Pause' : 'Lecture'}
            >
              {playerState.isPlaying ? (
                <Pause className="h-10 w-10" aria-hidden />
              ) : (
                <Play className="h-10 w-10" aria-hidden />
              )}
            </button>
            <button
              type="button"
              onClick={next}
              className="rounded-full p-3 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="Piste suivante"
            >
              <SkipForward className="h-8 w-8" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PlayerPage
