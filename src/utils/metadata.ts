import type { IAudioMetadata } from 'music-metadata-browser'

import type { Track } from '@/types/music'

const bufferToDataUrl = (picture: NonNullable<IAudioMetadata['common']['picture']>[number]) => {
  const blob = new Blob([picture.data], { type: picture.format })
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        resolve('')
      }
    }
    reader.readAsDataURL(blob)
  })
}

export const parseTrackFile = async (file: File): Promise<Omit<Track, 'id'>> => {
  const url = URL.createObjectURL(file)
  try {
    const { parseBlob } = await import('music-metadata-browser')
    const metadata = await parseBlob(file)
    const {
      common: { title, artist, album, track, year, picture },
      format: { duration },
    } = metadata

    let coverDataUrl: string | undefined
    if (picture && picture.length > 0) {
      coverDataUrl = await bufferToDataUrl(picture[0])
    }

    const artistName = artist || 'Artiste inconnu'
    const albumTitle = album || 'Album inconnu'

    return {
      file,
      url,
      title: title || file.name.replace(/\.mp3$/i, ''),
      artist: artistName,
      album: albumTitle,
      duration: duration || 0,
      coverDataUrl,
      trackNo: track?.no || undefined,
      year: year || undefined,
      importedAt: Date.now(),
    }
  } catch (error) {
    console.error('Failed to parse metadata', error)
    return {
      file,
      url,
      title: file.name.replace(/\.mp3$/i, ''),
      artist: 'Artiste inconnu',
      album: 'Album inconnu',
      duration: 0,
      coverDataUrl: undefined,
      year: undefined,
      importedAt: Date.now(),
    }
  }
}
