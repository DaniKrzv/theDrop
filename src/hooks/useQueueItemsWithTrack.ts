import { useMemo } from 'react'

import { useMusicStore } from '@/store/useMusicStore'
import type { QueueItemWithTrack } from '@/types/music'

export const useQueueItemsWithTrack = (): QueueItemWithTrack[] => {
  const queueItems = useMusicStore((state) => state.queue.items)
  const tracks = useMusicStore((state) => state.library.tracks)

  return useMemo(() => {
    return queueItems
      .map((item) => {
        const track = tracks[item.trackId]
        if (!track) return undefined
        return { ...item, track }
      })
      .filter((value): value is QueueItemWithTrack => Boolean(value))
  }, [queueItems, tracks])
}

export default useQueueItemsWithTrack
