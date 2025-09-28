import { useCallback } from 'react'

import type { Tusky } from '@tusky-io/ts-sdk/web'

import { detectAudioFormat, stripAudioExtension, type AudioFormat } from '@/utils/audioFormats'
import { withNetworkRetry, isTuskyLockedError, tuskyLockedMessage } from '@/utils/networkRetry'
import { useTrusky } from '@/trusky/TruskyProvider'

type TrackUploadRecord = {
  fileName: string
  format: AudioFormat
  uploadId: string
  size: number
}

type AlbumManifest = {
  album: string
  createdAt: string
  trackCount: number
  tracks: Array<{
    index: number
    title: string
    fileName: string
    uploadId: string
    format: AudioFormat
    size: number
  }>
}

export type AlbumUploadInput = {
  name: string
  files: File[]
}

export type AlbumUploadResult = {
  album: string
  vaultId: string
  tracksFolderId: string
  manifestUploadId: string
  tracks: TrackUploadRecord[]
}

// Add folder upload types
export type FolderUploadInput = {
  name: string
  structure: import('@/utils/folderUpload').FolderStructure
}

export type FolderUploadResult = {
  album: string
  vaultId: string
  tracksFolderId: string
  manifestUploadId: string
  tracks: TrackUploadRecord[]
  folderStructure: {
    [path: string]: string // path -> folderId mapping
  }
}

const FALLBACK_WAV_MIME = 'audio/wav'
const FALLBACK_MP3_MIME = 'audio/mpeg'

const sanitizeVaultName = (album: string) => {
  const trimmed = album.trim().toLowerCase()
  const base = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'album'
  const timestamp = Date.now().toString(36)
  return `thedrop-${base}-${timestamp}`
}

const buildManifest = (album: string, trackUploads: TrackUploadRecord[]): AlbumManifest => ({
  album,
  createdAt: new Date().toISOString(),
  trackCount: trackUploads.length,
  tracks: trackUploads.map((track, index) => ({
    index: index + 1,
    title: stripAudioExtension(track.fileName, track.format),
    fileName: track.fileName,
    uploadId: track.uploadId,
    format: track.format,
    size: track.size,
  })),
})

const runTuskyCall = async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
  try {
    return await withNetworkRetry(label, operation)
  } catch (error) {
    if (isTuskyLockedError(error)) {
      throw new Error(tuskyLockedMessage(label))
    }
    throw new Error(`Tusky a échoué durant ${label}`)
  }
}

export const useTuskyUpload = () => {
  const { tusky, connect } = useTrusky()

  const getTuskyClient = useCallback(async (): Promise<Tusky> => {
    if (tusky) {
      return tusky
    }
    const client = await connect()
    if (!client) {
      throw new Error('Impossible de se connecter à Trusky')
    }
    return client
  }, [connect, tusky])

  const uploadAlbum = useCallback(
    async ({ name, files }: AlbumUploadInput): Promise<AlbumUploadResult> => {
      if (files.length === 0) {
        throw new Error('Aucun fichier audio à uploader pour cet album')
      }

      const client = await getTuskyClient()

      const vaultName = sanitizeVaultName(name)
      const { id: vaultId } = await runTuskyCall('créer le vault Tusky', () =>
        client.vault.create(vaultName, { encrypted: false }),
      )
      const { id: tracksFolderId } = await runTuskyCall('créer le dossier des pistes', () =>
        client.folder.create(vaultId, 'tracks'),
      )

      const trackUploads: TrackUploadRecord[] = []

      for (const file of files) {
        const format = detectAudioFormat(file)
        const mimeType = file.type || (format === 'wav' ? FALLBACK_WAV_MIME : FALLBACK_MP3_MIME)
        const uploadId = await runTuskyCall('téléverser une piste sur Tusky', () =>
          client.file.upload(vaultId, file, {
            name: file.name,
            mimeType,
            parentId: tracksFolderId,
            lastModified: file.lastModified,
          }),
        )

        trackUploads.push({
          fileName: file.name,
          format,
          uploadId,
          size: file.size,
        })
      }

      const manifest = buildManifest(name, trackUploads)
      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json',
      })
      const manifestUploadId = await runTuskyCall('téléverser les métadonnées de l\'album', () =>
        client.file.upload(vaultId, manifestBlob, {
          name: 'album.json',
          mimeType: 'application/json',
        }),
      )

      return {
        album: name,
        vaultId,
        tracksFolderId,
        manifestUploadId,
        tracks: trackUploads,
      }
    },
    [getTuskyClient],
  )

  const uploadFolderStructure = useCallback(async (
    client: Tusky,
    vaultId: string,
    structure: import('@/utils/folderUpload').FolderStructure,
    parentId?: string
  ): Promise<{ folderId: string; trackUploads: TrackUploadRecord[]; subfolderIds: { [path: string]: string } }> => {
    // Create folder in Tusky
    const { id: folderId } = await runTuskyCall(`créer le dossier ${structure.name}`, () =>
      client.folder.create(vaultId, structure.name, parentId ? { parentId } : undefined),
    )

    const trackUploads: TrackUploadRecord[] = []
    const subfolderIds: { [path: string]: string } = {}

    // Upload files in current folder
    for (const file of structure.files) {
      const format = detectAudioFormat(file)
      const mimeType = file.type || (format === 'wav' ? FALLBACK_WAV_MIME : FALLBACK_MP3_MIME)
      const uploadId = await runTuskyCall(`téléverser ${file.name}`, () =>
        client.file.upload(vaultId, file, {
          name: file.name,
          mimeType,
          parentId: folderId,
          lastModified: file.lastModified,
        }),
      )

      trackUploads.push({
        fileName: file.name,
        format,
        uploadId,
        size: file.size,
      })
    }

    // Recursively upload subfolders
    for (const subfolder of structure.subfolders) {
      const subfolderResult = await uploadFolderStructure(client, vaultId, subfolder, folderId)
      trackUploads.push(...subfolderResult.trackUploads)
      Object.assign(subfolderIds, subfolderResult.subfolderIds)
      subfolderIds[subfolder.path] = subfolderResult.folderId
    }

    return { folderId, trackUploads, subfolderIds }
  }, [])

  const uploadFolder = useCallback(
    async ({ name, structure }: FolderUploadInput): Promise<FolderUploadResult> => {
      const client = await getTuskyClient()

      const vaultName = sanitizeVaultName(name)
      const { id: vaultId } = await runTuskyCall('créer le vault Tusky', () =>
        client.vault.create(vaultName, { encrypted: false }),
      )

      // Upload the folder structure
      const { trackUploads, subfolderIds } = await uploadFolderStructure(client, vaultId, structure)

      // Create manifest with folder structure information
      const manifest = {
        ...buildManifest(name, trackUploads),
        folderStructure: {
          root: structure.name,
          subfolders: subfolderIds,
        },
      }

      const manifestBlob = new Blob([JSON.stringify(manifest, null, 2)], {
        type: 'application/json',
      })
      const manifestUploadId = await runTuskyCall('téléverser les métadonnées du dossier', () =>
        client.file.upload(vaultId, manifestBlob, {
          name: 'folder.json',
          mimeType: 'application/json',
        }),
      )

      return {
        album: name,
        vaultId,
        tracksFolderId: subfolderIds[structure.path] || '',
        manifestUploadId,
        tracks: trackUploads,
        folderStructure: subfolderIds,
      }
    },
    [getTuskyClient, uploadFolderStructure],
  )

  return {
    uploadAlbum,
    uploadFolder,
  }
}

export type TuskyUploadHook = ReturnType<typeof useTuskyUpload>
