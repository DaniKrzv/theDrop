import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import AppLayout from '@/components/AppLayout'
import LibraryPage from '@/pages/LibraryPage'
import PlayerPage from '@/pages/PlayerPage'
import QueuePage from '@/pages/QueuePage'
import { playerSelectors, useMusicStore } from '@/store/useMusicStore'
import useQueueItemsWithTrack from '@/hooks/useQueueItemsWithTrack'

const focusableElements = new Set(['input', 'textarea', 'select', 'button'])

const App = () => {
  const location = useLocation()
  const currentTrack = useMusicStore(playerSelectors.currentTrack)
  const queueItems = useQueueItemsWithTrack()
  const play = useMusicStore((state) => state.play)
  const toggle = useMusicStore((state) => state.togglePlayPause)
  const next = useMusicStore((state) => state.next)
  const previous = useMusicStore((state) => state.previous)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (target && focusableElements.has(target.tagName.toLowerCase())) {
        return
      }
      if (event.code === 'Space') {
        event.preventDefault()
        if (!currentTrack && queueItems[0]?.track) {
          play(queueItems[0].trackId)
          return
        }
        toggle()
      }
      if (event.code === 'ArrowRight') {
        event.preventDefault()
        next()
      }
      if (event.code === 'ArrowLeft') {
        event.preventDefault()
        previous()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentTrack, next, play, previous, queueItems, toggle])

  useEffect(() => {
    if (location.pathname === '/') document.title = 'The Drop — Bibliothèque'
    if (location.pathname === '/player') document.title = 'The Drop — Lecteur vinyle'
    if (location.pathname === '/queue') document.title = 'The Drop — File d\'attente'
  }, [location.pathname])

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<LibraryPage />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/queue" element={<QueuePage />} />
      </Route>
    </Routes>
  )
}

export default App
