import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

const pad = (value: number): string => String(value).padStart(2, '0')

export interface CountdownParts {
  days: string
  hours: string
  minutes: string
  seconds: string
  isPast: boolean
}

const EMPTY: CountdownParts = {
  days: '00',
  hours: '00',
  minutes: '00',
  seconds: '00',
  isPast: true,
}

function compute(targetMs: number): CountdownParts {
  const diff = targetMs - Date.now()
  if (diff <= 0) return EMPTY

  const totalSeconds = Math.floor(diff / 1000)
  const days = Math.floor(totalSeconds / 86_400)
  const hours = Math.floor((totalSeconds % 86_400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return {
    days: pad(days),
    hours: pad(hours),
    minutes: pad(minutes),
    seconds: pad(seconds),
    isPast: false,
  }
}

/** Cuenta regresiva en vivo hacia la fecha del evento */
export function useCountdown(dateISO: string): CountdownParts {
  const targetMs = useMemo(() => new Date(dateISO).getTime(), [dateISO])
  const [parts, setParts] = useState<CountdownParts>(() => compute(targetMs))
  const timer = useRef<number | null>(null)

  const tick = useCallback((): void => setParts(compute(targetMs)), [targetMs])

  useEffect(() => {
    timer.current = window.setInterval(tick, 1000)
    return () => {
      if (timer.current !== null) window.clearInterval(timer.current)
    }
  }, [tick])

  return parts
}
