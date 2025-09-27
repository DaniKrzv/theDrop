import { motion } from 'framer-motion'
import { Trash2, Save, Shuffle, Repeat } from 'lucide-react'

import { QueueList } from '@/components/queue/QueueList'
import { queueSelectors, useMusicStore } from '@/store/useMusicStore'

export const QueuePage = () => {
  const items = useMusicStore(queueSelectors.itemsWithTrack)
  const play = useMusicStore((state) => state.play)
  const clearQueue = useMusicStore((state) => state.clearQueue)
  const moveInQueue = useMusicStore((state) => state.moveInQueue)
  const removeFromQueue = useMusicStore((state) => state.removeFromQueue)

  const handleReorder = (source: number, destination: number) => {
    moveInQueue(source, destination)
  }

  const handlePlayNow = (trackId: string) => {
    play(trackId)
  }

  const handleMoveUp = (queueItemId: string) => {
    const index = items.findIndex((item) => item.id === queueItemId)
    if (index > 0) moveInQueue(index, index - 1)
  }

  const handleMoveDown = (queueItemId: string) => {
    const index = items.findIndex((item) => item.id === queueItemId)
    if (index >= 0 && index < items.length - 1) moveInQueue(index, index + 1)
  }

  const handleRemove = (queueItemId: string) => {
    removeFromQueue(queueItemId)
  }

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-5 shadow-soft"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">File d&apos;attente</p>
          <h1 className="text-3xl font-semibold text-white">À venir</h1>
          <p className="text-sm text-slate-300">Organisez vos prochaines écoutes par glisser-déposer.</p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={clearQueue}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-red-400/70 hover:text-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Vider
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <Save className="h-4 w-4" aria-hidden />
            Sauver playlist
          </button>
        </div>
      </motion.div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
        {items.length === 0 ? (
          <div className="flex h-60 flex-col items-center justify-center text-sm text-slate-300">
            <p>Ajoutez des titres depuis la bibliothèque ou un album entier.</p>
          </div>
        ) : (
          <QueueList
            items={items}
            onReorder={handleReorder}
            onPlayNow={handlePlayNow}
            onRemove={handleRemove}
            onMoveDown={handleMoveDown}
            onMoveUp={handleMoveUp}
          />
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <Shuffle className="h-4 w-4" aria-hidden />
          Shuffle
        </button>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <Repeat className="h-4 w-4" aria-hidden />
          Boucle
        </button>
      </div>
    </div>
  )
}

export default QueuePage
