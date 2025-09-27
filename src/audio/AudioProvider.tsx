import { createContext, useContext, useEffect, useRef } from 'react'
import type { PropsWithChildren } from 'react'

import { playerSelectors, useMusicStore } from '@/store/useMusicStore'

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
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
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

    if (!currentTrack) {
      audio.pause()
      audio.removeAttribute('src')
      return
    }

    const currentSource = audio.src
    if (currentSource !== currentTrack.url) {
      audio.src = currentTrack.url
      audio.currentTime = desiredTime
      audio.load()
    }

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
