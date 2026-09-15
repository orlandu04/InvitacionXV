import { useMemo } from 'react'

import type { PerformanceLevel } from '../config/types'

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

let cached: PerformanceLevel | null = null

/** Detecta la capacidad del dispositivo una sola vez por sesión */
export function getPerformanceLevel(): PerformanceLevel {
  if (cached) return cached
  if (typeof navigator === 'undefined') return 'medium'

  const nav = navigator as NavigatorWithMemory
  const cores = nav.hardwareConcurrency ?? 4
  const memory = nav.deviceMemory ?? 4
  const saveData = nav.connection?.saveData ?? false
  const isTouch = window.matchMedia('(pointer: coarse)').matches

  if (saveData || cores <= 2 || memory <= 2) {
    cached = 'low'
  } else if (isTouch && (cores <= 6 || memory <= 4)) {
    cached = 'medium'
  } else if (!isTouch && cores >= 8 && memory >= 8) {
    cached = 'high'
  } else {
    cached = isTouch ? 'medium' : 'high'
  }

  return cached
}

export function usePerformance(): PerformanceLevel {
  return useMemo(() => getPerformanceLevel(), [])
}
