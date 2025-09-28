import { Menu, Search, LayoutGrid, ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'
import { useEffect, useRef, useState } from 'react'

import type { CollectionTab, SortOrder, ViewMode } from '@/types/music'

const sortLabels: Record<SortOrder, string> = {
  title: 'Titre A→Z',
  artist: 'Artiste',
  year: 'Année',
  added: 'Date d\'ajout',
}

export type LibraryHeaderProps = {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  collectionTab: CollectionTab
  onCollectionTabChange: (tab: CollectionTab) => void
  sortOrder: SortOrder
  onSortChange: (order: SortOrder) => void
  filter: string
  onFilterChange: (value: string) => void
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
}: LibraryHeaderProps) => {
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  const sortButtonRef = useRef<HTMLDivElement | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  const toggleView = () => {
    onViewModeChange(viewMode === 'carousel' ? 'grid' : 'carousel')
  }

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!sortButtonRef.current) return
      if (!sortButtonRef.current.contains(event.target as Node)) {
        setSortMenuOpen(false)
      }
    }

    if (sortMenuOpen) {
      window.addEventListener('mousedown', handleClick)
    }
    return () => {
      window.removeEventListener('mousedown', handleClick)
    }
  }, [sortMenuOpen])

  return (
    <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200 backdrop-blur-2xl shadow-soft">
      <div className="flex items-center gap-3">
        {/* Sort circular button with popover */}
        <div className="relative" ref={sortButtonRef}>
          <button
            type="button"
            onClick={() => setSortMenuOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            aria-haspopup="listbox"
            aria-expanded={sortMenuOpen}
            aria-label="Trier"
          >
            {/* Use ChevronDown rotated to suggest sort, or a custom glyph */}
            <ChevronDown className="h-5 w-5 -rotate-90" aria-hidden />
          </button>
          {sortMenuOpen && (
            <ul
              className="absolute left-0 top-12 z-20 flex w-44 flex-col gap-1 rounded-2xl border border-white/15 bg-slate-900/90 p-2 shadow-soft"
              role="listbox"
            >
              {Object.entries(sortLabels).map(([value, label]) => (
                <li key={value}>
                  <button
                    type="button"
                    className={clsx(
                      'flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition',
                      sortOrder === (value as SortOrder) ? 'bg-accent/90 text-slate-950' : 'text-slate-200 hover:bg-white/10',
                    )}
                    onClick={() => {
                      onSortChange(value as SortOrder)
                      setSortMenuOpen(false)
                    }}
                  >
                    <span>{label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Search circular button that expands to input */}
        <div className="relative">
          {!searchOpen ? (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" aria-hidden />
            </button>
          ) : (
            <div className="flex items-center overflow-hidden rounded-full border border-white/20 bg-white/10 pl-3 pr-2 shadow-inner transition-all md:w-80">
              <Search className="mr-2 h-4 w-4" aria-hidden />
              <input
                autoFocus
                value={filter}
                onChange={(e) => onFilterChange(e.target.value)}
                type="search"
                placeholder="Rechercher dans la bibliothèque"
                className="w-full bg-transparent py-2 text-sm text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Fermer la recherche"
                className="ml-2 rounded-full border border-white/20 bg-white/10 px-2 py-1 text-xs text-slate-200 hover:text-white"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
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
        onClick={toggleView}
        aria-label={viewMode === 'carousel' ? 'Afficher en grille' : 'Afficher en carrousel'}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
      >
        {viewMode === 'carousel' ? (
          <LayoutGrid className="h-5 w-5" aria-hidden />
        ) : (
          <Menu className="h-5 w-5 rotate-90" aria-hidden />
        )}
      </button>
    </header>
  )
}
