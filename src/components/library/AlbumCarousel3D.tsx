import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'

import type { Album } from '@/types/music'
import { extractInitials, gradientFromString } from '@/utils/formatters'

export type AlbumCarousel3DProps = {
  albums: Album[]
  onActiveChange?: (album: Album) => void
  onAlbumClick?: (album: Album) => void
}

const perspective = 1200
const itemSpacing = 260
const depthFactor = 260
const rotationFactor = 70

export const AlbumCarousel3D = ({ albums, onActiveChange, onAlbumClick }: AlbumCarousel3DProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const activeChangeRef = useRef<typeof onActiveChange | undefined>(onActiveChange)
  const stageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    activeChangeRef.current = onActiveChange
  }, [onActiveChange])

  const scrollAccumRef = useRef(0)
  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!albums.length) return
      scrollAccumRef.current += event.deltaY
      const threshold = 60
      if (Math.abs(scrollAccumRef.current) > threshold) {
        const dir = scrollAccumRef.current > 0 ? 1 : -1
        scrollAccumRef.current = 0
        setActiveIndex((prev) => {
          const next = Math.min(albums.length - 1, Math.max(0, prev + dir))
          if (next !== prev) {
            const album = albums[next]
            if (album) activeChangeRef.current?.(album)
          }
          return next
        })
      }
    },
    [albums],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      handleWheel(e)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [handleWheel])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let startY = 0
    const onTouchStart = (e: TouchEvent) => {
      startY = e.touches[0]?.clientY ?? 0
    }
    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0]?.clientY ?? 0
      const deltaY = startY - y
      handleWheel({ deltaY } as WheelEvent)
      startY = y
    }
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
    }
  }, [handleWheel])

  useEffect(() => {
    if (!albums.length) return
    const album = albums[activeIndex]
    if (album) activeChangeRef.current?.(album)
  }, [activeIndex, albums])

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

  const current = items[activeIndex]
  return (
    <div className="relative w-full" ref={containerRef} aria-label="Cover Flow" role="listbox">
      <div className="pointer-events-none h-[320px] w-full md:h-[380px]" aria-hidden="true" />
      <div
        ref={stageRef}
        className="absolute left-1/2 top-0 h-[320px] w-full max-w-6xl md:h-[380px]"
        style={{ perspective: `${perspective}px`, transform: 'translateX(-50%)' }}
      >
        {items.map((album, index) => {
          const rel = index - activeIndex
          const isActive = rel === 0
          const x = rel * itemSpacing
          const z = -Math.abs(rel) * depthFactor + (isActive ? 160 : -20)
          const rotY = rel * -rotationFactor
          return (
            <motion.button
              key={album.id}
              type="button"
              onClick={() => onAlbumClick?.(album)}
              className="absolute left-1/2 top-[30%] h-[240px] w-[240px] -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-[28px] border border-white/10 bg-slate-900/50 shadow-soft md:h-[260px] md:w-[260px] lg:h-[280px] lg:w-[280px]"
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ x, z, rotateY: rotY, scale: isActive ? 1 : 0.72, opacity: Math.abs(rel) > 4 ? 0 : 1, zIndex: 60 - Math.abs(rel) }}
              transition={{ type: 'spring', stiffness: 140, damping: 18 }}
              role="option"
              aria-selected={isActive}
            >
              <div className="relative h-full w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-950/40">
                {album.coverDataUrl ? (
                  <img src={album.coverDataUrl} alt={`Pochette de ${album.title}`} className="h-full w-full object-cover" draggable={false} />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold" style={{ backgroundImage: gradientFromString(`${album.artist}-${album.title}`) }}>
                    {extractInitials(album.title)}
                  </div>
                )}
                <div className="pointer-events-none absolute inset-x-0 -bottom-[36%] h-[42%] origin-top scale-y-[-1] overflow-hidden opacity-40">
                  {album.coverDataUrl ? (
                    <img src={album.coverDataUrl} alt="" aria-hidden className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ backgroundImage: gradientFromString(`${album.artist}-${album.title}`) }} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90" />
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      {current && (
        <div className="mt-12 text-center">
          <div className="text-xl font-semibold text-white leading-tight">{current.title}</div>
          <div className="text-sm text-slate-300">{current.artist}</div>
        </div>
      )}
    </div>
  )
}

export default AlbumCarousel3D
