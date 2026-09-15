import { useMemo } from 'react'

import { getPerformanceLevel } from '../../hooks/usePerformance'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { seededRandom } from '../../utils/random'

interface PetalsProps {
  /** Multiplicador de densidad (1 = estándar) */
  density?: number
  className?: string
}

interface PetalConfig {
  id: number
  left: string
  size: number
  fallDuration: number
  fallDelay: number
  swayDuration: number
  opacity: number
  rotate: number
  hue: 'rose' | 'gold' | 'deep'
}

const COUNTS: Record<string, number> = { high: 16, medium: 9, low: 5 }

const FILLS: Record<PetalConfig['hue'], string> = {
  rose: 'url(#petal-rose)',
  gold: 'url(#petal-gold)',
  deep: 'url(#petal-deep)',
}

/**
 * Pétalos de rosa cayendo — 100% CSS (compositado GPU, costo JS cero).
 * Profundidad mediante escala, opacidad y velocidades distintas.
 */
export function Petals({ density = 1, className = '' }: PetalsProps): React.JSX.Element | null {
  const reducedMotion = useReducedMotion()
  const level = getPerformanceLevel()

  const petals = useMemo<PetalConfig[]>(() => {
    if (reducedMotion) return []
    const rnd = seededRandom(151987)
    const total = Math.round((COUNTS[level] ?? 9) * density)
    const hues: PetalConfig['hue'][] = ['rose', 'rose', 'deep', 'gold']
    return Array.from({ length: total }, (_, id) => ({
      id,
      left: `${(id / total) * 100 + rnd() * (90 / total)}%`,
      size: 12 + rnd() * 18,
      fallDuration: 13 + rnd() * 9,
      fallDelay: -rnd() * 22,
      swayDuration: 2.6 + rnd() * 2.6,
      opacity: 0.35 + rnd() * 0.45,
      rotate: rnd() * 360,
      hue: hues[Math.floor(rnd() * hues.length)],
    }))
  }, [level, density, reducedMotion])

  if (reducedMotion || petals.length === 0) return null

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="petal-rose" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FBCFE8" />
            <stop offset="100%" stopColor="#F9A8D4" />
          </linearGradient>
          <linearGradient id="petal-gold" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F6E27A" />
            <stop offset="100%" stopColor="#D4AF37" />
          </linearGradient>
          <linearGradient id="petal-deep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F9A8D4" />
            <stop offset="100%" stopColor="#BE185D" />
          </linearGradient>
        </defs>
      </svg>

      {petals.map((petal) => (
        <span
          key={petal.id}
          className="absolute -top-[8vh]"
          style={{
            left: petal.left,
            animation: `fall-petal ${petal.fallDuration}s linear ${petal.fallDelay}s infinite`,
          }}
        >
          <span
            className="block origin-center"
            style={{ animation: `sway-petal ${petal.swayDuration}s ease-in-out infinite alternate` }}
          >
            <svg
              width={petal.size}
              height={petal.size * 1.45}
              viewBox="0 0 24 34"
              fill="none"
              style={{
                opacity: petal.opacity,
                transform: `rotate(${petal.rotate}deg)`,
                filter: petal.size < 16 ? 'blur(0.6px)' : undefined,
              }}
            >
              <path d="M12 1C19.5 8.5 21.5 17.5 12 33C2.5 17.5 4.5 8.5 12 1Z" fill={FILLS[petal.hue]} />
              <path
                d="M12 4C15 10 16 17 12 28"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="0.7"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </span>
      ))}
    </div>
  )
}
