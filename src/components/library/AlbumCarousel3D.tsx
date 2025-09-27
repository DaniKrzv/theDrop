import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import type { Album, Track } from '@/types/music'
import { extractInitials, gradientFromString } from '@/utils/formatters'

export type AlbumCarousel3DProps = {
  albums: Album[]
  tracks: Record<string, Track>
  onActiveChange?: (album: Album) => void
  onAlbumClick?: (album: Album) => void
}

const perspective = 1200

export const AlbumCarousel3D = ({ albums, tracks, onActiveChange, onAlbumClick }: AlbumCarousel3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (!albums.length) return
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const cards = Array.from(container.children) as HTMLElement[]
      if (!cards.length) return
      cards.forEach((card) => {
        card.style.scrollSnapAlign = 'center'
      })
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [albums.length])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const cards = Array.from(container.children) as HTMLElement[]
      const center = container.scrollLeft + container.offsetWidth / 2
      let closestIndex = 0
      let minDistance = Number.POSITIVE_INFINITY
      cards.forEach((card, index) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.abs(center - cardCenter)
        if (distance < minDistance) {
          minDistance = distance
          closestIndex = index
        }
      })
      setActiveIndex((prev) => {
        if (prev !== closestIndex) {
          const album = albums[closestIndex]
          if (album && onActiveChange) onActiveChange(album)
        }
        return closestIndex
      })
    }

    handleScroll()
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      container.removeEventListener('scroll', handleScroll)
    }
  }, [albums, onActiveChange])

  useEffect(() => {
    if (!albums.length) return
    const album = albums[activeIndex]
    if (album && onActiveChange) onActiveChange(album)
  }, [activeIndex, albums, onActiveChange])

  useEffect(() => {
    setActiveIndex(0)
  }, [albums.length])

  const items = useMemo(() => albums, [albums])

  if (!items.length) {
    return (
      <div className="mt-10 flex h-64 flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-sm text-slate-300">
        <p>Bibliothèque vide</p>
        <p className="mt-1 text-xs text-slate-400">Importez vos fichiers .mp3 pour voir vos albums ici.</p>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="scrollbar-none flex snap-x snap-mandatory items-center gap-6 overflow-x-auto px-8 py-6" ref={containerRef}>
        {items.map((album, index) => {
          const isActive = index === activeIndex
          const firstTrack = tracks[album.tracks[0]]
          return (
            <motion.button
              key={album.id}
              type="button"
              layout
              onClick={() => onAlbumClick?.(album)}
              className="relative h-[320px] min-w-[240px] cursor-pointer select-none rounded-[32px] border border-white/10 bg-slate-900/50 p-4 shadow-soft"
              style={{
                transformStyle: 'preserve-3d',
                perspective: `${perspective}px`,
              }}
              animate={{
                rotateY: (index - activeIndex) * -12,
                translateX: (index - activeIndex) * -45,
                translateZ: isActive ? 60 : -Math.abs(index - activeIndex) * 60,
                scale: isActive ? 1 : 0.86,
                opacity: Math.abs(index - activeIndex) > 3 ? 0 : 1,
                zIndex: 20 - Math.abs(index - activeIndex),
              }}
              transition={{ type: 'spring', stiffness: 140, damping: 18 }}
            >
              <div className="relative h-full w-full overflow-hidden rounded-3xl border border-white/15 bg-slate-950/40">
                {album.coverDataUrl ? (
                  <img
                    src={album.coverDataUrl}
                    alt={`Pochette de ${album.title}`}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-4xl font-bold"
                    style={{ backgroundImage: gradientFromString(`${album.artist}-${album.title}`) }}
                  >
                    {extractInitials(album.title)}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-4 text-left">
                  <h3 className="text-lg font-semibold text-white">{album.title}</h3>
                  <p className="text-xs uppercase tracking-wide text-slate-200">{album.artist}</p>
                  {firstTrack && (
                    <p className="text-[11px] text-slate-300">
                      {album.tracks.length} pistes • {Math.round(firstTrack.duration)} s
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
