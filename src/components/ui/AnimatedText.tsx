import { animateCharsIn } from '../../animations/effects'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useEffect, useRef } from 'react'

interface AnimatedTextProps {
  text: string
  delay?: number
  stagger?: number
  className?: string
}

/**
 * Texto que entra carácter a carácter (splitText + stagger).
 * Con reduced-motion se muestra sin animación.
 */
export function AnimatedText({
  text,
  delay = 0,
  stagger,
  className = '',
}: AnimatedTextProps): React.JSX.Element {
  const ref = useRef<HTMLSpanElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return
    return animateCharsIn(el, { delay, ...(stagger ? { stagger } : {}) })
  }, [delay, stagger, reducedMotion, text])

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  )
}
