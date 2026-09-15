import { useCallback, useEffect, useRef, useState } from 'react'

import { invitation } from '../config/invitation'
import { AmbientSynth } from '../lib/ambientSynth'

export type AudioStatus = 'idle' | 'playing' | 'paused' | 'unavailable'

export interface UseAudioReturn {
  status: AudioStatus
  volume: number
  setVolume: (value: number) => void
  play: () => void
  pause: () => void
  toggle: () => void
}

/**
 * Reproductor de audio con fallback generativo.
 * - Usa HTML Audio API con el archivo configurado (invitation.music.src).
 * - Si el archivo no existe o falla, cambia a un sintetizador ambiental
 *   generado con Web Audio API para que la experiencia nunca quede muda.
 * - Nunca reproduce antes de la interacción del usuario.
 */
export function useAudio(): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const synthRef = useRef<AmbientSynth | null>(null)
  const usingSynth = useRef(false)
  const [status, setStatus] = useState<AudioStatus>('idle')
  const [volume, setVolumeState] = useState<number>(invitation.music.initialVolume)

  const ensureSynth = useCallback((): AmbientSynth => {
    if (!synthRef.current) synthRef.current = new AmbientSynth()
    return synthRef.current
  }, [])

  const startSynth = useCallback(async (): Promise<boolean> => {
    const synth = ensureSynth()
    if (!synth.isAvailable) return false
    try {
      await synth.play()
      synth.setVolume(volume)
      usingSynth.current = true
      setStatus('playing')
      return true
    } catch {
      return false
    }
  }, [ensureSynth, volume])

  const play = useCallback((): void => {
    // Ruta sintetizada ya activa
    if (usingSynth.current) {
      void startSynth()
      return
    }
    try {
      if (!audioRef.current) {
        const el = new Audio()
        el.preload = 'auto'
        el.loop = true
        el.volume = volume
        el.addEventListener('playing', () => setStatus('playing'))
        el.addEventListener('pause', () => setStatus((s) => (s === 'unavailable' ? s : 'paused')))
        el.addEventListener('error', () => {
          usingSynth.current = true
          setStatus('idle')
          void startSynth()
        })
        el.src = invitation.music.src
        audioRef.current = el
      }
      const promise = audioRef.current.play()
      if (promise) promise.catch(() => void startSynth())
    } catch {
      void startSynth()
    }
  }, [startSynth, volume])

  const pause = useCallback((): void => {
    if (usingSynth.current) {
      synthRef.current?.pause()
      setStatus('paused')
      return
    }
    audioRef.current?.pause()
  }, [])

  const toggle = useCallback((): void => {
    if (status === 'playing') pause()
    else play()
  }, [status, play, pause])

  const setVolume = useCallback(
    (value: number): void => {
      const clamped = Math.min(1, Math.max(0, value))
      setVolumeState(clamped)
      if (audioRef.current) audioRef.current.volume = clamped
      synthRef.current?.setVolume(clamped)
    },
    [],
  )

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
      audioRef.current?.remove()
      audioRef.current = null
      synthRef.current?.dispose()
      synthRef.current = null
    }
  }, [])

  return { status, volume, setVolume, play, pause, toggle }
}
