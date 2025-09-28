import { useCallback } from 'react'
import type { Tusky } from '@tusky-io/ts-sdk/web'
import { useTrusky } from '@/trusky/TruskyProvider'
import type { Track } from '@/types/music'


// List files within an 'album' folder if present, else vault root
async function listAlbumScopeFiles(client: any, vaultId: string, manifest?: any): Promise<{ files: any[]; parentId?: string }> {
  try {
    // First try to find an 'album' subfolder
    const foldersPage: any = await client.folder.list({ vaultId })
    const folders: any[] = foldersPage?.items ?? foldersPage?.data ?? []
    // Prefer explicit tracksFolderId from manifest
    if (manifest?.tracksFolderId) {
      const filesPage: any = await client.file.list({ vaultId, parentId: manifest.tracksFolderId })
      const files: any[] = filesPage?.items ?? filesPage?.data ?? []
      return { files, parentId: manifest.tracksFolderId }
    }
    // Else try folder named "album"
    const albumFolder = folders.find((f: any) => typeof f?.name === "string" && f.name.toLowerCase() === "album")
    if (albumFolder?.id) {
      const filesPage: any = await client.file.list({ vaultId, parentId: albumFolder.id })
      const files: any[] = filesPage?.items ?? filesPage?.data ?? []
      return { files, parentId: albumFolder.id }
    }
    // Else try folder matching manifest album title
    if (manifest?.album) {
      const titleFolder = folders.find((f: any) => typeof f?.name === "string" && f.name.toLowerCase() === String(manifest.album).toLowerCase())
      if (titleFolder?.id) {
        const filesPage: any = await client.file.list({ vaultId, parentId: titleFolder.id })
        const files: any[] = filesPage?.items ?? filesPage?.data ?? []
        return { files, parentId: titleFolder.id }
      }
    }
    // Else, if there is exactly one folder, assume it contains tracks
    if (folders.length === 1 && folders[0]?.id) {
      const filesPage: any = await client.file.list({ vaultId, parentId: folders[0].id })
      const files: any[] = filesPage?.items ?? filesPage?.data ?? []
      return { files, parentId: folders[0].id }
    }
  } catch (error) {
    console.log('No album subfolder found, checking vault root:', error)
  }
  
  // Fallback: vault root contains the album files directly
  console.log(`Using vault root for files`)
  const filesPage: any = await client.file.list({ vaultId })
  const files: any[] = filesPage?.items ?? filesPage?.data ?? []
  return { files }
}

export type TuskyAlbumSummary = {
  vaultId: string
  albumFolderId: string
  title: string
  trackCount: number
}

export const useTuskyLibrary = () => {
  const { tusky, connect } = useTrusky()

  const getClient = useCallback(async (): Promise<Tusky> => {
    if (tusky) return tusky
    const client = await connect()
    if (!client) throw new Error('Unable to connect to Tusky')
    return client
  }, [connect, tusky])

  const listAlbums = useCallback(async (): Promise<TuskyAlbumSummary[]> => {
    const client = await getClient()

    const vaultsPage: any = await (client as any).vault.list()
    const vaults: any[] = vaultsPage?.items ?? vaultsPage?.data ?? []
    // Find single shared vault named 'theDrop'
    const mainVault = vaults.find((v: any) => typeof v?.name === 'string' && v.name.toLowerCase() === 'thedrop')
    if (!mainVault) return []

    // List subfolders (each is an album)
    const foldersPage: any = await (client as any).folder.list({ vaultId: mainVault.id })
    const folders: any[] = foldersPage?.items ?? foldersPage?.data ?? []

    const results: TuskyAlbumSummary[] = []
    for (const f of folders) {
      if (!f?.id || !f?.name) continue
      // Read manifest within the folder
      let manifest: any | null = null
      try {
        const filesPage: any = await (client as any).file.list({ vaultId: mainVault.id, parentId: f.id })
        const files: any[] = filesPage?.items ?? filesPage?.data ?? []
        let manifestFile = files.find((x: any) => x?.name === 'album.json' || x?.name === 'folder.json')
        if (!manifestFile) {
          manifestFile = files.find((x: any) => typeof x?.name === 'string' && x.name.toLowerCase().endsWith('.json'))
        }
        if (manifestFile) {
          const blob: any = await (client as any).file.download(mainVault.id, manifestFile.id)
          if (blob && typeof blob.text === 'function') {
            const text = await blob.text()
            manifest = JSON.parse(text)
          }
        }
      } catch {}

      const trackCount = manifest?.trackCount ?? (manifest?.tracks?.length ?? 0)
      results.push({
        vaultId: mainVault.id,
        albumFolderId: f.id,
        title: manifest?.album ?? f.name,
        trackCount,
      })
    }

    return results
  }, [getClient])

  const fetchAlbumTracks = useCallback(async (vaultId: string, albumFolderId?: string): Promise<Omit<Track, 'id'>[]> => {
    const client = await getClient()
    let files: any[] = []
    let folderName: string | undefined
    if (albumFolderId) {
      // Resolve folder name for album title fallback
      try {
        const foldersPage: any = await (client as any).folder.list({ vaultId })
        const folders: any[] = foldersPage?.items ?? foldersPage?.data ?? []
        const current = folders.find((f: any) => f?.id === albumFolderId)
        folderName = current?.name
      } catch {}
      const filesPage: any = await (client as any).file.list({ vaultId, parentId: albumFolderId })
      files = filesPage?.items ?? filesPage?.data ?? []
    } else {
      const scope = await listAlbumScopeFiles(client as any, vaultId)
      files = scope.files
    }

    // First, read the manifest to get track metadata and file IDs
    let manifest: any | null = null
    try {
      let manifestFile = files.find((f: any) => f?.name === 'album.json' || f?.name === 'folder.json')
      if (!manifestFile) {
        // fallback: pick the first json file in the vault if present
        manifestFile = files.find((f: any) => typeof f?.name === 'string' && f.name.toLowerCase().endsWith('.json'))
      }
      if (manifestFile) {
        const blob: any = await (client as any).file.download(vaultId, manifestFile.id)
        if (blob && typeof blob.text === 'function') {
          manifest = JSON.parse(await blob.text())
        }
      }
    } catch (error) {
      console.warn('Failed to read manifest:', error)
    }

    // Re-scope to subfolder if manifest indicates tracks are not at root
    try {
      if (!albumFolderId) {
      const rescope = await listAlbumScopeFiles(client as any, vaultId, manifest)
      files = rescope.files
    }
    } catch {}

    // If we have a manifest with tracks, use it; otherwise fall back to file listing
    const tracks: Omit<Track, 'id'>[] = []
    
    if (manifest?.tracks && Array.isArray(manifest.tracks)) {
        console.log('Manifest tracks:', manifest?.tracks?.map((t: any) => ({ uploadId: t.uploadId, fileName: t.fileName })))
        console.log('Available files:', files.map(f => ({ id: f.id, name: f.name })))

      // Use manifest data - create tracks from manifest entries
      for (const trackData of manifest.tracks) {
        if (!trackData.fileId && !trackData.fileName) continue
        
        // Find the corresponding file in the vault using uploadId or fileName
        const fileInfo = files.find((f: any) => 
          f.id === trackData.uploadId || f.name === trackData.fileName
        )
        
        if (!fileInfo) {
          console.warn(`File not found for track:`, {
            uploadId: trackData.uploadId,
            fileName: trackData.fileName,
            availableFiles: files.map(f => ({ id: f.id, name: f.name }))
          })
          continue
        }
        
        console.log(`Matched track ${trackData.fileName} to file ${fileInfo.id}`)

        const streamingUrl = `tusky://${vaultId}/${fileInfo.id}`

        tracks.push({
          file: undefined, // No local file - streaming only
          url: streamingUrl,
          title: trackData.title || fileInfo.name.replace(/\.(mp3|wav|wave)$/i, ''),
          artist: manifest.artist || 'Unknown Artist',
          album: (manifest.album || folderName || 'Unknown Album'),
          duration: 0, // Will be calculated when the track is first played
          trackNo: trackData.index,
          year: manifest.year,
          coverDataUrl: undefined,
          importedAt: Date.now(),
        })
      }
    } else {
      // Fallback: use file listing if no manifest
      const trackFiles = files.filter((f) => typeof f?.name === 'string' && /\.(mp3|wav|wave)$/i.test(f.name))
      
      for (const f of trackFiles) {
        const streamingUrl = `tusky://${vaultId}/${f.id}`
        
        tracks.push({
          file: undefined, // No local file - streaming only
          url: streamingUrl,
          title: f.name.replace(/\.(mp3|wav|wave)$/i, ''),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          duration: 0,
          trackNo: undefined,
          year: undefined,
          coverDataUrl: undefined,
          importedAt: Date.now(),
        })
      }
    }

    // Sort by track number if available
    tracks.sort((a, b) => (a.trackNo ?? 0) - (b.trackNo ?? 0))

    return tracks
  }, [getClient])

  return { listAlbums, fetchAlbumTracks }
}

// Helper: build a progressive streaming URL using MediaSource
export async function createStreamingUrl(tusky: any, vaultId: string, fileId: string, mime: string = 'audio/mpeg') {
  // Try tusky.file.stream with best-guess signature
  const stream: ReadableStream<Uint8Array> =
    typeof tusky?.file?.stream === 'function'
      ? (await (tusky.file.stream.length === 1 ? tusky.file.stream(fileId) : tusky.file.stream(vaultId, fileId)))
      : (await tusky.file.download(vaultId, fileId)).stream()

  // If MediaSource not supported, fallback to blob
  if (typeof window === 'undefined' || (window as any).MediaSource === undefined) {
    const blob = await new Response(stream, { headers: { 'Content-Type': mime } }).blob()
    return URL.createObjectURL(blob)
  }

  const mediaSource = new MediaSource()
  const url = URL.createObjectURL(mediaSource)
  mediaSource.addEventListener('sourceopen', async () => {
    const sourceBuffer = mediaSource.addSourceBuffer(mime)
    const reader = stream.getReader()

    const pump = async (): Promise<void> => {
      const { value, done } = await reader.read()
      if (done) {
        try { mediaSource.endOfStream() } catch {}
        return
      }
      sourceBuffer.appendBuffer(value!)
      sourceBuffer.addEventListener('updateend', () => { void pump() }, { once: true })
    }
    try { await pump() } catch { try { mediaSource.endOfStream('network') } catch {} }
  }, { once: true })

  return url
}
