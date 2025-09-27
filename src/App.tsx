import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'

import { DockNav } from '@/components/DockNav'
import { ImportBar } from '@/components/ImportBar'
import { playerSelectors, queueSelectors, useMusicStore } from '@/store/useMusicStore'

const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const PlayerPage = lazy(() => import('@/pages/PlayerPage'))
const QueuePage = lazy(() => import('@/pages/QueuePage'))

const focusableElements = new Set(['input', 'textarea', 'select', 'button'])

const App = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const player = useMusicStore(playerSelectors.state)
  const currentTrack = useMusicStore(playerSelectors.currentTrack)
  const queueItems = useMusicStore(queueSelectors.itemsWithTrack)
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

  useEffect(() => {
    if (!player.currentTrackId && queueItems.length > 0) {
      navigate('/queue')
    }
  }, [navigate, player.currentTrackId, queueItems.length])

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-32 pt-10 sm:px-8">
      <ImportBar />
      <main className="mt-6 flex-1">
        <Suspense
          fallback={
            <div className="mt-12 flex items-center justify-center text-sm text-slate-300">
              Chargement de la scène…
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<LibraryPage />} />
            <Route path="/player" element={<PlayerPage />} />
            <Route path="/queue" element={<QueuePage />} />
          </Routes>
        </Suspense>
      </main>
      <DockNav />
    </div>
  )
}

export default App
