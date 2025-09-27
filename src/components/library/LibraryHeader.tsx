import { Menu, Search, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { CollectionTab, SortOrder, ViewMode } from '@/types/music'

const sortLabels: Record<SortOrder, string> = {
  title: 'Titre A→Z',
  artist: 'Artiste',
  year: 'Année',
  added: 'Date d\'ajout',
}

const rateOptions = [0.5, 1, 1.25, 1.5]

export type LibraryHeaderProps = {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  collectionTab: CollectionTab
  onCollectionTabChange: (tab: CollectionTab) => void
  sortOrder: SortOrder
  onSortChange: (order: SortOrder) => void
  filter: string
  onFilterChange: (value: string) => void
  playbackRate: number
  onRateChange: (rate: number) => void
}

export const LibraryHeader = ({
  viewMode,
  onViewModeChange,
  collectionTab,
  onCollectionTabChange,
  sortOrder,
  onSortChange,
  filter,
  onFilterChange,
  playbackRate,
  onRateChange,
}: LibraryHeaderProps) => {
  const [rateMenuOpen, setRateMenuOpen] = useState(false)
  const rateButtonRef = useRef<HTMLDivElement | null>(null)

  const displayRate = useMemo(() => `${playbackRate.toFixed(2).replace(/\.00$/, '')}×`, [playbackRate])

  const toggleView = () => {
    onViewModeChange(viewMode === 'carousel' ? 'grid' : 'carousel')
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!rateButtonRef.current) return
      if (!rateButtonRef.current.contains(event.target as Node)) {
        setRateMenuOpen(false)
      }
    }

    if (rateMenuOpen) {
      window.addEventListener('mousedown', handleClick)
    }
    return () => {
      window.removeEventListener('mousedown', handleClick)
    }
  }, [rateMenuOpen])

  return (
    <header className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200 backdrop-blur-2xl shadow-soft">
      <div className="flex items-center justify-between">
        <div className="relative" ref={rateButtonRef}>
          <button
            type="button"
            onClick={() => setRateMenuOpen((value) => !value)}
            className="flex h-10 items-center rounded-full border border-white/20 bg-white/10 px-4 font-semibold text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-haspopup="listbox"
            aria-expanded={rateMenuOpen}
          >
            {displayRate}
            <ChevronDown className="ml-2 h-4 w-4" aria-hidden />
          </button>
          {rateMenuOpen && (
            <ul
              className="absolute top-12 z-20 flex w-36 flex-col gap-1 rounded-2xl border border-white/15 bg-slate-900/90 p-2 shadow-soft"
              role="listbox"
            >
              {rateOptions.map((rate) => (
                <li key={rate}>
                  <button
                    type="button"
                    className={clsx(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition',
                      playbackRate === rate ? 'bg-accent/90 text-slate-950' : 'text-slate-200 hover:bg-white/10',
                    )}
                    onClick={() => {
                      onRateChange(rate)
                      setRateMenuOpen(false)
                    }}
                  >
                    <span>{rate.toFixed(2).replace(/\.00$/, '')}×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 p-1 text-xs font-medium text-slate-200">
          {(['albums', 'playlists'] as CollectionTab[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onCollectionTabChange(item)}
              className={clsx(
                'rounded-full px-4 py-2 capitalize transition',
                collectionTab === item ? 'bg-white/90 text-slate-950 shadow-soft' : 'text-slate-200 hover:text-white',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex w-full items-center overflow-hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-300 shadow-inner md:w-80">
            <Search className="mr-2 h-4 w-4" aria-hidden />
            <input
              value={filter}
              onChange={(event) => onFilterChange(event.target.value)}
              type="search"
              placeholder="Rechercher dans la bibliothèque"
              className="w-full bg-transparent text-sm text-white placeholder:text-slate-400 focus:outline-none"
              aria-label="Rechercher"
            />
          </div>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(event) => onSortChange(event.target.value as SortOrder)}
              className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-white shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="Trier les albums"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <option key={value} value={value} className="bg-slate-900">
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleView}
          className="self-start rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:border-accent/70 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          {viewMode === 'carousel' ? 'Afficher en grille' : 'Afficher en carrousel'}
        </button>
      </div>
    </header>
  )
}
