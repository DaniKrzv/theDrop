import { useCallback, useMemo, useRef, useState } from 'react'

import clsx from 'clsx'
import { CloudUpload, FolderPlus, Loader2, XCircle, Folder, FileAudio } from 'lucide-react'

import { useTuskyUpload, type FolderUploadResult } from '@/trusky/useTuskyUpload'
import { useTrusky } from '@/trusky/TruskyProvider'
import { processFolderUpload, formatFileSize, type ProcessedFolder } from '@/utils/folderUpload'

type UploadState = {
  status: 'pending' | 'uploading' | 'success' | 'error'
  message?: string
  result?: FolderUploadResult
}

const truncate = (value: string, max = 32) => {
  if (value.length <= max) return value
  return `${value.slice(0, max - 1)}…`
}

export const FolderUploadPanel = () => {
  const folderInputRef = useRef<HTMLInputElement | null>(null)
  const { isConnected, isConnecting } = useTrusky()
  const { uploadFolder } = useTuskyUpload()

  const [folders, setFolders] = useState<ProcessedFolder[]>([])
  const [uploading, setUploading] = useState(false)
  const [states, setStates] = useState<Record<string, UploadState>>({})
  const [dropActive, setDropActive] = useState(false)

  const totalTracks = useMemo(() => folders.reduce((acc, folder) => acc + folder.totalFiles, 0), [folders])
  const totalSize = useMemo(() => folders.reduce((acc, folder) => acc + folder.totalSize, 0), [folders])

  const resetSelections = () => {
    setFolders([])
    setStates({})
  }

  const processFolders = useCallback((incoming: FileList | File[]) => {
    const collection = Array.from(incoming)
    if (collection.length === 0) return

    // Convert File[] to FileList-like object
    const fileList = {
      ...collection,
      item: (index: number) => collection[index] || null,
      length: collection.length,
    } as FileList

    const processed = processFolderUpload(fileList)
    setFolders(processed)
    setStates(
      processed.reduce<Record<string, UploadState>>((acc, folder) => {
        acc[folder.name] = { status: 'pending' }
        return acc
      }, {}),
    )
  }, [])

  const handleFolderChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const { files } = event.target
    if (!files) return
    processFolders(files)
    event.target.value = ''
  }

  const handleDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    setDropActive(false)
    const { files } = event.dataTransfer
    if (files && files.length > 0) {
      processFolders(files)
    }
  }

  const handleDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault()
    setDropActive(true)
  }

  const handleDragLeave = () => setDropActive(false)

  const handleUpload = async () => {
    if (folders.length === 0 || uploading) return

    setUploading(true)
    try {
      for (const folder of folders) {
        setStates((prev) => ({
          ...prev,
          [folder.name]: { status: 'uploading' },
        }))

        try {
          const result = await uploadFolder({
            name: folder.name,
            structure: folder.structure,
          })
          setStates((prev) => ({
            ...prev,
            [folder.name]: { status: 'success', result },
          }))
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Échec de l\'upload'
          setStates((prev) => ({
            ...prev,
            [folder.name]: { status: 'error', message },
          }))
        }
      }
    } finally {
      setUploading(false)
    }
  }

  const renderFolderStructure = (structure: any, depth = 0) => {
    return (
      <div className="ml-4">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Folder className="h-4 w-4" />
          <span>{structure.name}</span>
          <span className="text-xs">({structure.files.length} files)</span>
        </div>
        {structure.files.map((file: File, index: number) => (
          <div key={index} className="ml-6 flex items-center gap-2 text-xs text-slate-400">
            <FileAudio className="h-3 w-3" />
            <span>{file.name}</span>
            <span>({formatFileSize(file.size)})</span>
          </div>
        ))}
        {structure.subfolders.map((subfolder: any, index: number) => (
          <div key={index}>
            {renderFolderStructure(subfolder, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <section className="space-y-6 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Upload Folders to Walrus</h2>
          <p className="text-sm text-slate-300">
            Upload entire folders with .mp3 tracks to Walrus storage via Tusky
          </p>
        </div>
        {folders.length > 0 && (
          <button
            onClick={resetSelections}
            className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20"
          >
            <XCircle className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>

      <div
        className={clsx(
          'relative rounded-2xl border-2 border-dashed p-8 transition-colors',
          dropActive
            ? 'border-accent/60 bg-white/10 shadow-glow'
            : 'border-white/20 bg-white/5 hover:border-white/30',
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/10 text-accent">
            <FolderPlus className="h-8 w-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Upload Music Folders</h3>
          <p className="mt-2 text-sm text-slate-300">
            Drag and drop folders here, or click to select folders
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Only .mp3 and .wav files will be uploaded
          </p>
        </div>

        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: '' } as any)}
          {...({ directory: '' } as any)}
          multiple
          accept=".mp3,.wav,.wave,audio/mpeg,audio/mp3,audio/wav,audio/x-wav,audio/wave"
          onChange={handleFolderChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </div>

      {folders.length > 0 && (
        <div className="space-y-4">
          <div className="rounded-lg border border-white/10 bg-white/10 p-4">
            <h4 className="font-medium text-white">Selected Folders</h4>
            <p className="text-sm text-slate-300">
              {folders.length} folder{folders.length !== 1 ? 's' : ''} • {totalTracks} track{totalTracks !== 1 ? 's' : ''} • {formatFileSize(totalSize)}
            </p>
          </div>

          <div className="space-y-3">
            {folders.map((folder) => {
              const state = states[folder.name]
              return (
                <div
                  key={folder.name}
                  className="rounded-lg border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Folder className="h-5 w-5 text-blue-500" />
                      <div>
                        <h5 className="font-medium text-white">{truncate(folder.name, 40)}</h5>
                        <p className="text-sm text-slate-300">
                          {folder.totalFiles} track{folder.totalFiles !== 1 ? 's' : ''} • {formatFileSize(folder.totalSize)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {state?.status === 'uploading' && (
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                      )}
                      {state?.status === 'success' && (
                        <div className="text-green-600">
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {state?.status === 'error' && (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>

                  {state?.message && (
                    <p className="mt-2 text-sm text-red-600">{state.message}</p>
                  )}

                  <div className="mt-3">
                    {renderFolderStructure(folder.structure)}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleUpload}
              disabled={uploading || !isConnected}
              className={clsx(
                'flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors',
                uploading || !isConnected
                  ? 'cursor-not-allowed bg-gray-300 text-slate-400'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
              )}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <CloudUpload className="h-4 w-4" />
                  Upload to Walrus
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!isConnected && (
        <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
          <p className="text-sm text-yellow-200">
            {isConnecting ? 'Connecting to Tusky...' : 'Please connect to Tusky to upload folders'}
          </p>
        </div>
      )}
    </section>
  )
}
