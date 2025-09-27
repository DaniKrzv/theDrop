import { CSS } from '@dnd-kit/utilities'
import { useSortable } from '@dnd-kit/sortable'
import { GripVertical, Play, ArrowUp, ArrowDown, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'

import type { QueueItemWithTrack } from '@/types/music'
import { extractInitials, formatDuration, gradientFromString } from '@/utils/formatters'

export type QueueItemCardProps = {
  item: QueueItemWithTrack
  onPlayNow: (trackId: string) => void
  onMoveUp: (queueItemId: string) => void
  onMoveDown: (queueItemId: string) => void
  onRemove: (queueItemId: string) => void
}

export const QueueItemCard = ({ item, onPlayNow, onMoveDown, onMoveUp, onRemove }: QueueItemCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <motion.li
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`group flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 shadow-soft transition ${isDragging ? 'border-accent/70 shadow-glow' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-slate-200 opacity-0 transition group-hover:opacity-100"
          {...attributes}
          {...listeners}
          aria-label="Déplacer"
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </button>
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/15">
          {item.track.coverDataUrl ? (
            <img src={item.track.coverDataUrl} alt={item.track.title} className="h-full w-full object-cover" />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center text-base font-semibold"
              style={{ backgroundImage: gradientFromString(`${item.track.artist}-${item.track.album}`) }}
            >
              {extractInitials(item.track.title)}
            </div>
          )}
        </div>
        <div>
          <p className="font-semibold text-white">{item.track.title}</p>
          <p className="text-xs text-slate-300">{item.track.artist}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-300">
        <span>{formatDuration(item.track.duration)}</span>
        <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:text-accent"
            aria-label="Lire maintenant"
            onClick={() => onPlayNow(item.trackId)}
          >
            <Play className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:text-accent"
            aria-label="Monter"
            onClick={() => onMoveUp(item.id)}
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:text-accent"
            aria-label="Descendre"
            onClick={() => onMoveDown(item.id)}
          >
            <ArrowDown className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            className="rounded-full border border-white/10 bg-white/10 p-2 text-white transition hover:text-red-400"
            aria-label="Supprimer"
            onClick={() => onRemove(item.id)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </motion.li>
  )
}
