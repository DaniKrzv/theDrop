import { useCallback, useRef, useState } from 'react'
import { Upload, FolderDown } from 'lucide-react'

import { useMusicStore } from '@/store/useMusicStore'
import { parseTrackFile } from '@/utils/metadata'
import type { Track } from '@/types/music'

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/mp3']

const isMp3 = (file: File) => ACCEPTED_TYPES.includes(file.type) || file.name.toLowerCase().endsWith('.mp3')

export const ImportBar = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const addTracks = useMusicStore((state) => state.addTracks)
  const [isDragging, setIsDragging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [isImporting, setIsImporting] = useState(false)

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const collection = Array.from(files).filter(isMp3)
      if (collection.length === 0) return

      setIsImporting(true)
      setProgress(0)

      // Group by top-level folder when available, otherwise by filename (sans extension)
      const groups = new Map<string, File[]>()
      for (const file of collection) {
        const rel = (file as any).webkitRelativePath as string | undefined
        const groupKey = rel && rel.includes('/') ? rel.split('/')[0] : file.name.replace(/\.mp3$/i, '')
        const arr = groups.get(groupKey) ?? []
        arr.push(file)
        groups.set(groupKey, arr)
      }

      const allParsed: Omit<Track, 'id'>[] = []
      let processed = 0

      for (const [albumTitle, filesInGroup] of groups) {
        // Parse sequentially to keep progress meaningful
        const parsedGroup: Omit<Track, 'id'>[] = []
        for (const file of filesInGroup) {
          // eslint-disable-next-line no-await-in-loop
          const track = await parseTrackFile(file)
          parsedGroup.push(track)
          processed += 1
          setProgress(Math.round((processed / collection.length) * 100))
        }

        // Determine album artist and cover from the first parsed track with data
        const firstWithMeta = parsedGroup.find((t) => Boolean(t.artist) || Boolean(t.coverDataUrl)) ?? parsedGroup[0]
        const albumArtist = (firstWithMeta?.artist?.trim() || 'Artiste inconnu') as string
        const albumCover = firstWithMeta?.coverDataUrl

        // Override album title for every track in the group to ensure grouping;
        // also normalize artist to keep a single album key (artist + album)
        for (const t of parsedGroup) {
          allParsed.push({
            ...t,
            album: albumTitle,
            artist: albumArtist,
            coverDataUrl: t.coverDataUrl ?? albumCover,
          })
        }
      }

      addTracks(allParsed)
      setTimeout(() => {
        setProgress(0)
        setIsImporting(false)
      }, 600)
    },
    [addTracks],
  )

  const onDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    setIsDragging(false)
    const { files } = event.dataTransfer
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy'
    }
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { files } = event.target
    if (!files) return
    handleFiles(files)
    event.target.value = ''
  }

  return (
    <section
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative flex flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-sm transition-all duration-300 ease-out ${isDragging ? 'border-accent/60 bg-white/10 shadow-glow' : 'shadow-soft'}`}
      aria-label="Importer des fichiers audio"
    >
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-accent transition-transform ${isDragging ? 'scale-110' : ''}`}
        >
          <Upload className="h-8 w-8" aria-hidden />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-white">Importer votre bibliothèque</h2>
          <p className="mt-2 text-sm text-slate-300">
            Glissez-déposez jusqu&apos;à 500 fichiers .mp3 ou sélectionnez-les manuellement.
          </p>
          {isImporting && (
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onButtonClick}
          className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:border-accent/70 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          <FolderDown className="h-4 w-4" aria-hidden />
          Importer des fichiers
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          onChange={onFileChange}
          className="hidden"
          // @ts-expect-error non-standard, supported by Chromium-based browsers
          webkitdirectory=""
        />
      </div>
    </section>
  )
}
