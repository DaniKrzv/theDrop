export const formatDuration = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export const extractInitials = (text: string) => {
  return text
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment[0]?.toUpperCase())
    .join('')
    .padEnd(2, '•')
}

export const gradientFromString = (input: string) => {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = hash % 360
  const secondary = (hue + 45) % 360
  return `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${secondary}, 70%, 35%))`
}
