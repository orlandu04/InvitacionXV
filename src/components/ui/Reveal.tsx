import { fadeUp } from '../../animations/reveals'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLayoutEffect, useRef, type ReactNode } from 'react'

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
}

/**
 * Envoltorio genérico: el contenido entra con fade + ascenso
 * la primera vez que entra al viewport.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
}: RevealProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return
    return fadeUp(el, { trigger: el, delay })
  }, [delay, reducedMotion])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
