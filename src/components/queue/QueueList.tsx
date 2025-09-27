import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

import { QueueItemCard, type QueueItemWithTrack } from '@/components/queue/QueueItemCard'

export type QueueListProps = {
  items: QueueItemWithTrack[]
  onReorder: (sourceIndex: number, destinationIndex: number) => void
  onPlayNow: (trackId: string) => void
  onRemove: (queueItemId: string) => void
  onMoveUp: (queueItemId: string) => void
  onMoveDown: (queueItemId: string) => void
}

export const QueueList = ({ items, onReorder, onPlayNow, onRemove, onMoveDown, onMoveUp }: QueueListProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const sourceIndex = items.findIndex((item) => item.id === active.id)
    const destinationIndex = items.findIndex((item) => item.id === over.id)
    if (sourceIndex >= 0 && destinationIndex >= 0) {
      onReorder(sourceIndex, destinationIndex)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <QueueItemCard
              key={item.id}
              item={item}
              onPlayNow={onPlayNow}
              onRemove={onRemove}
              onMoveDown={onMoveDown}
              onMoveUp={onMoveUp}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
