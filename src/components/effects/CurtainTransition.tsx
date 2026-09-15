import { curtainTimeline } from '../../animations/effects'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLayoutEffect, useRef } from 'react'

import { invitation } from '../../config/invitation'

/**
 * Transición tipo cortina cinematográfica entre secciones:
 * dos paneles rosas entran desde los lados, se encuentran en el centro
 * mostrando el monograma, y luego se abren revelando la siguiente escena.
 * Con reduced-motion se degrada a un divisor elegante.
 */
export function CurtainTransition(): React.JSX.Element {
  const sectionRef = useRef<HTMLElement>(null)
  const monogramRef = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || reducedMotion) return
    return curtainTimeline(section, { monogram: monogramRef.current })
  }, [reducedMotion])

  if (reducedMotion) {
    return (
      <div className="relative flex h-[38vh] items-center justify-center bg-gradient-to-b from-blush via-rose-pastel/60 to-rose-deep/80" aria-hidden="true">
        <div className="gold-hairline absolute w-2/3" />
        <span className="text-gilded font-script relative z-10 px-6 py-3 text-5xl">{invitation.initials}</span>
      </div>
    )
  }

  return (
    <section
      ref={sectionRef}
      aria-hidden="true"
      className="relative h-screen overflow-hidden"
    >
      <div className="curtain-panel absolute inset-y-0 left-0 w-1/2 grain bg-gradient-to-br from-rose-dark via-rose-deep to-rose-intense/90 will-change-transform" />
      <div className="curtain-panel absolute inset-y-0 right-0 w-1/2 grain bg-gradient-to-bl from-rose-dark via-rose-deep to-rose-intense/90 will-change-transform" />

      {/* filo dorado central */}
      <div className="absolute inset-y-0 left-1/2 z-10 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-gold/70 to-transparent" />

      <span
        ref={monogramRef}
        className="text-gilded font-script absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-[clamp(7rem,26vw,15rem)] opacity-0"
      >
        {invitation.initials}
      </span>
    </section>
  )
}
