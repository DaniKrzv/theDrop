import { Lock, Maximize2, Settings } from 'lucide-react'

import { VinylTurntable } from '@/components/player/VinylTurntable'
import { PlayerControls } from '@/components/player/PlayerControls'
import { TrackInfo } from '@/components/player/TrackInfo'
import { playerSelectors, queueSelectors, useMusicStore } from '@/store/useMusicStore'

export const PlayerPage = () => {
  const currentTrack = useMusicStore(playerSelectors.currentTrack)
  const playerState = useMusicStore(playerSelectors.state)
  const queueItems = useMusicStore(queueSelectors.itemsWithTrack)
  const play = useMusicStore((state) => state.play)
  const toggle = useMusicStore((state) => state.togglePlayPause)
  const next = useMusicStore((state) => state.next)
  const previous = useMusicStore((state) => state.previous)
  const seek = useMusicStore((state) => state.seek)
  const setVolume = useMusicStore((state) => state.setVolume)

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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-end gap-3">
        {[{ icon: Lock, label: 'Verrouiller' }, { icon: Maximize2, label: 'Plein écran' }, { icon: Settings, label: 'Paramètres' }].map(({ icon: Icon, label }) => (
          <button
            key={label}
            type="button"
            className="rounded-full border border-white/10 bg-white/10 p-3 text-slate-200 transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-label={label}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft lg:flex-row">
        <VinylTurntable track={currentTrack} isPlaying={playerState.isPlaying} />
        <div className="flex flex-1 flex-col justify-between">
          <TrackInfo track={currentTrack} />
          <PlayerControls
            isPlaying={playerState.isPlaying}
            currentTime={playerState.currentTime}
            duration={currentTrack?.duration ?? 0}
            volume={playerState.volume}
            onToggle={handleToggle}
            onPrevious={previous}
            onNext={next}
            onSeek={seek}
            onVolume={setVolume}
          />
        </div>
      </div>
    </div>
  )
}

export default PlayerPage
