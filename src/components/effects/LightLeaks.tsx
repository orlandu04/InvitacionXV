import { gsap } from 'gsap'
import { useLayoutEffect, useRef } from 'react'

import { getPerformanceLevel } from '../../hooks/usePerformance'
import { useReducedMotion } from '../../hooks/useReducedMotion'

interface LightLeaksProps {
  intensity?: number
  className?: string
}

/**
 * Fugas de luz cinematográficas: auras radiales rosadas y doradas
 * que respiran lentamente. El blur se desactiva en gama baja (.no-blur).
 */
export function LightLeaks({ intensity = 0.55, className = '' }: LightLeaksProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const level = getPerformanceLevel()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return
    if (level === 'low') return

    const ctx = gsap.context(() => {
      gsap.to(el.querySelectorAll('.light-leak'), {
        opacity: (i) => intensity * (i === 1 ? 0.5 : 0.85),
        scale: (i) => 1.12 + i * 0.08,
        duration: 6,
        yoyo: true,
        repeat: -1,
        ease: 'sine.inOut',
        stagger: 0.8,
      })
    }, el)
    return () => ctx.revert()
  }, [intensity, reducedMotion, level])

  return (
    <div ref={ref} className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      <div
        className="light-leak absolute -left-[15%] top-[-10%] h-[46vmax] w-[46vmax] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(236,72,153,0.32), transparent 65%)',
          opacity: intensity * 0.6,
          ['--leak-opacity' as string]: intensity,
        }}
      />
      <div
        className="light-leak absolute -right-[12%] bottom-[8%] h-[40vmax] w-[40vmax] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(212,175,55,0.26), transparent 62%)',
          opacity: intensity * 0.45,
          ['--leak-opacity' as string]: intensity,
        }}
      />
      <div
        className="light-leak absolute left-[30%] top-[35%] h-[30vmax] w-[30vmax] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(251,207,232,0.4), transparent 60%)',
          opacity: intensity * 0.5,
          ['--leak-opacity' as string]: intensity,
        }}
      />
    </div>
  )
}
