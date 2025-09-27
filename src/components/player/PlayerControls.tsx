import { useId } from 'react'
import { Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'

import { formatDuration } from '@/utils/formatters'

export type PlayerControlsProps = {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  onToggle: () => void
  onPrevious: () => void
  onNext: () => void
  onSeek: (time: number) => void
  onVolume: (volume: number) => void
}

export const PlayerControls = ({
  isPlaying,
  currentTime,
  duration,
  volume,
  onToggle,
  onPrevious,
  onNext,
  onSeek,
  onVolume,
}: PlayerControlsProps) => {
  const seekId = useId()
  const volumeId = useId()

  const handleSeek: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = Number(event.target.value)
    onSeek(value)
  }

  const handleVolume: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = Number(event.target.value)
    onVolume(value)
  }

  return (
    <section className="mt-10 flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 shadow-soft">
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onPrevious}
          aria-label="Morçeau précédent"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <SkipBack className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggle}
          aria-label={isPlaying ? 'Pause' : 'Lecture'}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-accent text-slate-950 shadow-glow transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {isPlaying ? <Pause className="h-7 w-7" aria-hidden /> : <Play className="h-7 w-7" aria-hidden />}
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="Morçeau suivant"
          className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/10 transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <SkipForward className="h-5 w-5" aria-hidden />
        </button>
      </div>
      <div>
        <label htmlFor={seekId} className="sr-only">
          Position de lecture
        </label>
        <input
          id={seekId}
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(currentTime, duration || 0)}
          onChange={handleSeek}
          className="range-track w-full"
        />
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>{formatDuration(currentTime)}</span>
          <span>{formatDuration(duration)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4" aria-hidden />
          <label htmlFor={volumeId} className="sr-only">
            Volume
          </label>
          <input
            id={volumeId}
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            className="h-1 w-44 rounded-full bg-white/20 accent-accent"
          />
        </div>
      </div>
    </section>
  )
}
