import { createContext, useContext, useEffect, useRef } from 'react'
import type { PropsWithChildren } from 'react'

import { playerSelectors, useMusicStore } from '@/store/useMusicStore'
import { useTrusky } from '@/trusky/TruskyProvider'
import { createStreamingUrl } from '@/trusky/useTuskyLibrary'

type AudioContextValue = {
  audio: HTMLAudioElement | null
}

const InternalAudioContext = createContext<AudioContextValue>({ audio: null })

export const AudioProvider = ({ children }: PropsWithChildren) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentTrack = useMusicStore(playerSelectors.currentTrack)
  const isPlaying = useMusicStore((state) => state.player.isPlaying)
  const volume = useMusicStore((state) => state.player.volume)
  const rate = useMusicStore((state) => state.player.rate)
  const desiredTime = useMusicStore((state) => state.player.currentTime)
  const setCurrentTime = useMusicStore((state) => state.setCurrentTime)
  const next = useMusicStore((state) => state.next)

  useEffect(() => {
    if (!audioRef.current) {
      try {
        audioRef.current = new Audio()
        audioRef.current.preload = 'metadata'
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('[thedrop] Unable to initialize HTMLAudioElement', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = Math.min(Math.max(volume, 0), 1)
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.playbackRate = rate
  }, [rate])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }
    const handleEnded = () => {
      next()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [next, setCurrentTime])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!currentTrack || !currentTrack.url) {
      audio.pause()
      audio.removeAttribute('src')
      return
    }

    /* const currentSource = audio.src */
    const setSrc = (url: string) => {
      if (audio.src !== url) {
        audio.src = url
        audio.currentTime = desiredTime
        audio.load()
      }
    }

    const maybeStream = async () => {
      try {
        const url = currentTrack.url
        if (url.startsWith('tusky://')) {
          const match = /^tusky:\/\/([^/]+)\/(.+)$/.exec(url)
          if (match) {
            const [, vaultId, fileId] = match
            const tuskyClient = useTrusky().tusky
            if (tuskyClient) {
              const streamUrl = await createStreamingUrl(tuskyClient as any, vaultId, fileId)
              setSrc(streamUrl)
              return
            }
          }
        }
        setSrc(url)
      } catch (error) {
        console.warn('Streaming failed, trying local fallback:', error)
        const f = (currentTrack as any).file as File | undefined
        if (f) {
          const blobUrl = URL.createObjectURL(f)
          setSrc(blobUrl)
          return
        }
        // If no local file and streaming failed, try the original URL as last resort
        console.warn('No fallback available, using original URL')
        setSrc(currentTrack.url)
      }
    }
    void maybeStream()

    const play = async () => {
      try {
        if (isPlaying) {
          await audio.play()
        } else {
          audio.pause()
        }
      } catch (error) {
        console.warn('Audio playback error', error)
      }
    }

    play()
  }, [currentTrack, desiredTime, isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const diff = Math.abs(audio.currentTime - desiredTime)
    if (diff > 0.3) {
      audio.currentTime = desiredTime
    }
  }, [desiredTime])

  return (
    <InternalAudioContext.Provider value={{ audio: audioRef.current }}>
      {children}
    </InternalAudioContext.Provider>
  )
}

export const useAudio = () => useContext(InternalAudioContext)
