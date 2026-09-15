import { fadeUp } from '../../animations/reveals'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useLayoutEffect, useRef } from 'react'

interface SectionTitleProps {
  eyebrow?: string
  title: string
  tone?: 'light' | 'dark'
  align?: 'center' | 'left'
  className?: string
}

/** Título de sección editorial con filete dorado y entrada animada */
export function SectionTitle({
  eyebrow,
  title,
  tone = 'light',
  align = 'center',
  className = '',
}: SectionTitleProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion) return
    const cleanups = Array.from(el.children).map((child, index) =>
      fadeUp(child as HTMLElement, { trigger: el, delay: index * 0.15 }),
    )
    return () => cleanups.forEach((fn) => fn())
  }, [reducedMotion])

  const textColor = tone === 'light' ? 'text-ink' : 'text-blush'
  const eyebrowColor = tone === 'light' ? 'text-rose-deep' : 'text-gold-light'
  const preHidden = reducedMotion ? '' : 'opacity-0'

  return (
    <div
      ref={ref}
      className={`${align === 'center' ? 'text-center' : 'text-left'} ${textColor} ${className}`}
    >
      {eyebrow && <p className={`eyebrow ${eyebrowColor} mb-5 ${preHidden}`}>{eyebrow}</p>}
      <h2 className={`type-display-xl font-medium ${preHidden}`}>{title}</h2>
      <div className={`gold-hairline mt-7 w-40 ${preHidden} ${align === 'center' ? 'mx-auto' : ''}`} />
    </div>
  )
}
