import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'

import floralCorner from '../../assets/florals/floral-corner.svg'
import floralSide from '../../assets/florals/floral-side.svg'
import floralSprig from '../../assets/florals/floral-sprig.svg'
import { useReducedMotion } from '../../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

type FloralVariant = 'corner' | 'sprig' | 'side'

const SOURCES: Record<FloralVariant, string> = {
  corner: floralCorner,
  sprig: floralSprig,
  side: floralSide,
}

const OFFSETS: Record<'left' | 'right' | 'bottom' | 'top', { x: number; y: number }> = {
  left: { x: -110, y: 0 },
  right: { x: 110, y: 0 },
  bottom: { x: 0, y: 110 },
  top: { x: 0, y: -110 },
}

interface FloralDecorationProps {
  variant?: FloralVariant
  className?: string
  /** Dirección de entrada de la flor */
  from?: 'left' | 'right' | 'bottom' | 'top'
  /** Parallax sutil ligado al scroll (recorrido en px) */
  drift?: number
  flipX?: boolean
  flipY?: boolean
  width?: number
}

/**
 * Elemento floral decorativo con entrada editorial y parallax opcional.
 * Se posiciona con clases del consumidor (p. ej. absolute -left-10 top-8).
 */
export function FloralDecoration({
  variant = 'corner',
  className = '',
  from = 'bottom',
  drift = 0,
  flipX = false,
  flipY = false,
  width = 180,
}: FloralDecorationProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return

    const ctx = gsap.context(() => {
      const offset = OFFSETS[from]
      gsap.fromTo(
        el,
        { opacity: 0, x: offset.x, y: offset.y, rotate: offset.x !== 0 ? offset.x * 0.04 : -6 },
        {
          opacity: 0.9,
          x: 0,
          y: 0,
          rotate: 0,
          duration: 1.5,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top bottom', once: true },
        },
      )
      if (drift !== 0) {
        gsap.fromTo(
          el,
          { yPercent: -drift / 2 },
          {
            yPercent: drift / 2,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
            },
          },
        )
      }
    }, el)
    return () => ctx.revert()
  }, [from, drift, reducedMotion])

  return (
    <div ref={ref} className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <img
        src={SOURCES[variant]}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        style={{
          width,
          transform: `scale(${flipX ? -1 : 1}, ${flipY ? -1 : 1})`,
          opacity: reducedMotion ? 0.9 : undefined,
        }}
      />
    </div>
  )
}
