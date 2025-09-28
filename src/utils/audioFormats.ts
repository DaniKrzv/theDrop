export type AudioFormat = 'mp3' | 'wav' | 'flac' | 'aiff'

const MIME_TYPES: Record<AudioFormat, string[]> = {
  mp3: ['audio/mpeg', 'audio/mp3'],
  wav: ['audio/wav', 'audio/x-wav', 'audio/wave', 'audio/vnd.wave'],
  flac: ['audio/flac', 'audio/x-flac'],
  aiff: ['audio/aiff', 'audio/x-aiff', 'audio/aif'],
}

const EXTENSIONS: Record<AudioFormat, string[]> = {
  mp3: ['.mp3'],
  wav: ['.wav', '.wave'],
  flac: ['.flac'],
  aiff: ['.aiff', '.aif'],
}

const MIME_LOOKUP = new Map<string, AudioFormat>()
Object.entries(MIME_TYPES).forEach(([format, types]) => {
  types.forEach((type) => MIME_LOOKUP.set(type.toLowerCase(), format as AudioFormat))
})

const EXTENSION_LOOKUP = new Map<string, AudioFormat>()
Object.entries(EXTENSIONS).forEach(([format, suffixes]) => {
  suffixes.forEach((suffix) => EXTENSION_LOOKUP.set(suffix.toLowerCase(), format as AudioFormat))
})

export const SUPPORTED_AUDIO_MIME_TYPES = new Set(Array.from(MIME_LOOKUP.keys()))
export const SUPPORTED_AUDIO_EXTENSIONS = new Set(Array.from(EXTENSION_LOOKUP.keys()))

export const SUPPORTED_AUDIO_ACCEPT_ATTRIBUTE = Array.from(
  new Set([
    ...Array.from(SUPPORTED_AUDIO_MIME_TYPES),
    ...Array.from(SUPPORTED_AUDIO_EXTENSIONS),
  ]),
).join(',')

export const detectAudioFormat = (file: File): AudioFormat => {
  const type = file.type?.toLowerCase()
  if (type && MIME_LOOKUP.has(type)) {
    return MIME_LOOKUP.get(type) ?? 'mp3'
  }

  const name = file.name?.toLowerCase()
  if (name?.includes('.')) {
    const extension = name.slice(name.lastIndexOf('.'))
    if (EXTENSION_LOOKUP.has(extension)) {
      return EXTENSION_LOOKUP.get(extension) ?? 'mp3'
    }
  }

  return 'mp3'
}

export const isSupportedAudioFile = (file: File) => {
  if (file.type && SUPPORTED_AUDIO_MIME_TYPES.has(file.type.toLowerCase())) {
    return true
  }
  const name = file.name?.toLowerCase()
  if (!name) return false
  const extension = name.includes('.') ? name.slice(name.lastIndexOf('.')) : ''
  return SUPPORTED_AUDIO_EXTENSIONS.has(extension)
}

export const stripAudioExtension = (fileName: string, format: AudioFormat) => {
  const lowered = fileName.toLowerCase()
  const suffixes = EXTENSIONS[format]
  for (const suffix of suffixes) {
    if (lowered.endsWith(suffix)) {
      return fileName.slice(0, -suffix.length)
    }
  }
  return fileName
}

export const audioFormatToMoveDiscriminant: Record<AudioFormat, number> = {
  mp3: 0,
  wav: 1,
  flac: 2,
  aiff: 3,
}

