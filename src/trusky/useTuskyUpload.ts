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

const FALLBACK_WAV_MIME = 'audio/wav'
const FALLBACK_MP3_MIME = 'audio/mpeg'

const sanitizeVaultName = (album: string) => {
  const trimmed = album.trim().toLowerCase()
  const base = trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'album'
  const timestamp = Date.now().toString(36)
  return `thedrop-${base}-${timestamp}`
}

const buildManifest = (album: string, tracks: TrackUploadRecord[]): AlbumManifest => ({
  album,
  createdAt: new Date().toISOString(),
  trackCount: tracks.length,
  tracks: tracks.map((track, index) => ({
    index,
    title: stripAudioExtension(track.fileName, track.format),
    fileName: track.fileName,
    uploadId: track.uploadId,
    format: track.format,
    size: track.size,
  })),
})

const runTuskyCall = async <T>(label: string, fn: () => Promise<T>): Promise<T> => {
  try {
    return await withNetworkRetry(label, fn)
  } catch (error) {
    if (isTuskyLockedError(error)) {
      throw new Error(tuskyLockedMessage(label))
    }
    throw error instanceof Error ? error : new Error(`Tusky a échoué durant ${label}`)
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

  return {
    uploadAlbum,
  }
}

export type TuskyUploadHook = ReturnType<typeof useTuskyUpload>
