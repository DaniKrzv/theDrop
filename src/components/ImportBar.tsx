import { useCallback, useRef, useState } from 'react'
import { Upload, FolderDown } from 'lucide-react'

import { useMusicStore } from '@/store/useMusicStore'
import { parseTrackFile } from '@/utils/metadata'

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

      const parsed = [] as Awaited<ReturnType<typeof parseTrackFile>>[]

      for (let index = 0; index < collection.length; index += 1) {
        const file = collection[index]
        // eslint-disable-next-line no-await-in-loop
        const track = await parseTrackFile(file)
        parsed.push(track)
        setProgress(Math.round(((index + 1) / collection.length) * 100))
      }

      addTracks(parsed)
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
      className={`relative flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-5 text-sm transition-all duration-300 ease-out sm:flex-row sm:items-center sm:justify-between ${isDragging ? 'border-accent/60 bg-white/10 shadow-glow' : 'shadow-soft'}`}
      aria-label="Importer des fichiers audio"
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-accent transition-transform ${isDragging ? 'scale-110' : ''}`}
        >
          <Upload className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <p className="text-base font-semibold">Importer votre bibliothèque</p>
          <p className="text-xs text-slate-400">
            Glissez-déposez jusqu&apos;à 500 fichiers .mp3 ou sélectionnez-les manuellement.
          </p>
          {isImporting && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onButtonClick}
          className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-accent/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
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
        />
      </div>
    </section>
  )
}
