import { useMemo } from 'react'

import { getPerformanceLevel } from '../../hooks/usePerformance'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { seededRandom } from '../../utils/random'

interface SparklesProps {
  density?: number
  className?: string
}

interface SparkConfig {
  id: number
  left: string
  top: string
  size: number
  delay: number
  duration: number
}

const COUNTS: Record<string, number> = { high: 26, medium: 15, low: 8 }

/** Destellos de cuatro puntas que titilan — puro CSS */
export function Sparkles({ density = 1, className = '' }: SparklesProps): React.JSX.Element {
  const reducedMotion = useReducedMotion()
  const level = getPerformanceLevel()

  const sparks = useMemo<SparkConfig[]>(() => {
    const rnd = seededRandom(20270515)
    const total = Math.round((COUNTS[level] ?? 15) * density)
    return Array.from({ length: total }, (_, id) => ({
      id,
      left: `${rnd() * 100}%`,
      top: `${rnd() * 100}%`,
      size: 5 + rnd() * 9,
      delay: rnd() * 4,
      duration: 2.4 + rnd() * 3,
    }))
  }, [level, density])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {sparks.map((spark) => (
        <svg
          key={spark.id}
          className="absolute text-gold-light"
          style={{
            left: spark.left,
            top: spark.top,
            width: spark.size,
            height: spark.size,
            animation: reducedMotion
              ? undefined
              : `twinkle ${spark.duration}s ease-in-out ${spark.delay}s infinite`,
            opacity: reducedMotion ? 0.35 : undefined,
          }}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 0c.9 6.8 4.3 10.2 12 12-7.7 1.8-11.1 5.2-12 12-.9-6.8-4.3-10.2-12-12C7.7 10.2 11.1 6.8 12 0Z" />
        </svg>
      ))}
    </div>
  )
}
