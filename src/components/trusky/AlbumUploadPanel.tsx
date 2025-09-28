import { useCallback, useMemo, useRef, useState } from 'react'

import clsx from 'clsx'
import { CloudUpload, FolderPlus, Loader2, XCircle } from 'lucide-react'

import { useTuskyUpload, type AlbumUploadInput, type AlbumUploadResult } from '@/trusky/useTuskyUpload'
import { useTrusky } from '@/trusky/TruskyProvider'
import { isMp3OrWavFile } from '@/utils/audioFormats'

const AUDIO_ACCEPT = '.mp3,.wav,.wave,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave'

type AlbumGroup = AlbumUploadInput

type UploadState = {
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
  result?: AlbumUploadResult
}

const truncate = (value: string, max = 32) => {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

const sortFilesByName = (files: File[]) => [...files].sort((a, b) => a.name.localeCompare(b.name))

const groupByAlbum = (files: File[]) => {
  const groups = new Map<string, File[]>()

  for (const file of files) {
    const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
    if (!relativePath || !relativePath.includes('/')) {
      continue
    }
    const [rawFolder] = relativePath.split('/')
    const folder = rawFolder?.trim()
    if (!folder) continue
    const existing = groups.get(folder) ?? []
    existing.push(file)
    groups.set(folder, existing)
  }

  return Array.from(groups.entries()).map<AlbumGroup>(([name, albumFiles]) => ({
    name,
    files: sortFilesByName(albumFiles),
  }))
}

export const AlbumUploadPanel = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { isConnected, isConnecting } = useTrusky()
  const { uploadAlbum } = useTuskyUpload()

  const [albums, setAlbums] = useState<AlbumGroup[]>([])
  const [uploading, setUploading] = useState(false)
  const [states, setStates] = useState<Record<string, UploadState>>({})
  const [skippedFiles, setSkippedFiles] = useState<string[]>([])
  const [missingFolders, setMissingFolders] = useState<string[]>([])
  const [dropActive, setDropActive] = useState(false)

  const totalTracks = useMemo(() => albums.reduce((acc, album) => acc + album.files.length, 0), [albums])

  const resetSelections = () => {
    setAlbums([])
    setStates({})
    setSkippedFiles([])
    setMissingFolders([])
  }

  const processFiles = useCallback((incoming: FileList | File[]) => {
    const collection = Array.from(incoming)
    if (collection.length === 0) return

    const eligible: File[] = []
    const skipped: string[] = []
    const missing: string[] = []

    for (const file of collection) {
      if (!isMp3OrWavFile(file)) {
        skipped.push(file.name)
        continue
      }
      const relativePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath
      if (!relativePath || !relativePath.includes('/')) {
        missing.push(file.name)
        continue
      }
      eligible.push(file)
    }

    const grouped = groupByAlbum(eligible)
    setAlbums(grouped)
    setStates(
      grouped.reduce<Record<string, UploadState>>((acc, album) => {
        acc[album.name] = { status: 'pending' }
        return acc
      }, {}),
    )
    setSkippedFiles(skipped)
    setMissingFolders(missing)
  }, [])

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { files } = event.target
    if (!files) return
    processFiles(files)
    event.target.value = ''
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    setDropActive(false)
    const { files } = event.dataTransfer
    if (files && files.length > 0) {
      processFiles(files)
    }
  }

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    setDropActive(true)
  }

  const handleDragLeave = () => setDropActive(false)

  const handleUpload = async () => {
    if (albums.length === 0 || uploading) return

    setUploading(true)
    try {
      for (const album of albums) {
        setStates((prev) => ({
          ...prev,
          [album.name]: { status: 'uploading' },
        }))

        try {
          const result = await uploadAlbum(album)
          setStates((prev) => ({
            ...prev,
            [album.name]: { status: 'success', result },
          }))
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Échec de l\'upload'
          setStates((prev) => ({
            ...prev,
            [album.name]: { status: 'error', message },
          }))
        }
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <section
      className={clsx(
        'relative flex flex-col gap-5 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft transition-all',
        dropActive && 'border-accent/60 bg-white/10 shadow-glow',
      )}
      aria-label="Uploader des albums vers Walrus"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Walrus</p>
          <h2 className="text-2xl font-semibold text-white">Uploader vos albums</h2>
          <p className="text-sm text-slate-300">
            Sélectionnez un dossier par album (formats .mp3 ou .wav). Chaque dossier sera publié dans un vault Walrus via
            Trusky.
          </p>
          {!isConnected && !isConnecting && (
            <p className="text-xs text-amber-300">Connectez votre wallet et Trusky avant de lancer l&apos;upload.</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:border-accent/70 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
          >
            <FolderPlus className="h-4 w-4" aria-hidden />
            Sélectionner un dossier
          </button>
          {albums.length > 0 && (
            <button
              type="button"
              onClick={resetSelections}
              disabled={uploading}
              className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 transition hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500"
            >
              <XCircle className="h-3 w-3" aria-hidden />
              Réinitialiser
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={AUDIO_ACCEPT}
            multiple
            onChange={handleFileChange}
            className="hidden"
            // @ts-expect-error non-standard but supported in Chromium-based browsers
            webkitdirectory=""
          />
        </div>
      </div>

      <div
        className={clsx(
          'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-12 text-center text-slate-200 transition',
          dropActive ? 'border-accent/60 bg-white/10' : '',
        )}
      >
        <CloudUpload className="h-7 w-7 text-accent" aria-hidden />
        <p className="text-sm">
          Glissez-déposez vos dossiers d&apos;albums ici ou utilisez le bouton ci-dessus.
        </p>
        <p className="text-xs text-slate-400">Formats acceptés : .mp3, .wav. Un dossier = un album.</p>
      </div>

      {(skippedFiles.length > 0 || missingFolders.length > 0) && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
          {skippedFiles.length > 0 && (
            <p>
              Ignoré (format non supporté) : <span className="font-semibold">{truncate(skippedFiles.join(', '), 90)}</span>
            </p>
          )}
          {missingFolders.length > 0 && (
            <p>
              Fichiers hors dossier : <span className="font-semibold">{truncate(missingFolders.join(', '), 90)}</span>
            </p>
          )}
        </div>
      )}

      {albums.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>{albums.length} album(s) prêts · {totalTracks} piste(s)</span>
            <span className="hidden sm:inline">Un vault Walrus sera créé par album</span>
          </div>
          <ul className="space-y-2">
            {albums.map((album) => {
              const state = states[album.name] ?? { status: 'pending' }
              const icon = {
                pending: null,
                uploading: <Loader2 className="h-4 w-4 animate-spin text-accent" aria-hidden />,
                success: <CloudUpload className="h-4 w-4 text-emerald-300" aria-hidden />,
                error: <XCircle className="h-4 w-4 text-rose-400" aria-hidden />,
              }[state.status]

              return (
                <li
                  key={album.name}
                  className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-white">{album.name}</span>
                      <span className="text-xs text-slate-400">{album.files.length} piste(s)</span>
                    </div>
                    {icon}
                  </div>
                  {state.status === 'success' && state.result && (
                    <p className="text-[11px] text-emerald-300">
                      Vault {truncate(state.result.vaultId, 24)} · Manifest {truncate(state.result.manifestUploadId, 24)}
                    </p>
                  )}
                  {state.status === 'error' && state.message && (
                    <p className="text-[11px] text-rose-300">{state.message}</p>
                  )}
                </li>
              )}
            )}
          </ul>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              Chaque piste sera téléversée avec son nom original. Un fichier `album.json` récapitulatif est ajouté à chaque vault.
            </p>
            <button
              type="button"
              onClick={() => void handleUpload()}
              disabled={albums.length === 0 || uploading}
              className={clsx(
                'flex items-center gap-2 rounded-full border border-accent/60 bg-accent/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-accent transition hover:border-accent hover:bg-accent/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-500',
                uploading && 'opacity-80',
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Upload en cours…
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" aria-hidden />
                  Uploader sur Walrus
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

export default AlbumUploadPanel
