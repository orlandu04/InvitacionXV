import { kenBurns, parallaxY, revealImage } from '../../animations/effects'
import { getPerformanceLevel } from '../../hooks/usePerformance'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { useEffect, useRef } from 'react'

interface ParallaxImageProps {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  /** Velocidad del parallax en % — valores pequeños = sutil */
  speed?: number
  /** Zoom perpetuo muy lento (Ken Burns) */
  slowZoom?: boolean
  /** Revelado editorial con máscara al entrar */
  reveal?: boolean
  loading?: 'lazy' | 'eager'
}

/**
 * Fotografía con profundidad: parallax suave + revelado con máscara.
 * La imagen se renderiza ligeramente escalada para dar margen al movimiento.
 */
export function ParallaxImage({
  src,
  alt,
  className = '',
  imgClassName = '',
  speed = 7,
  slowZoom = false,
  reveal = true,
  loading = 'lazy',
}: ParallaxImageProps): React.JSX.Element {
  const wrapRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const reducedMotion = useReducedMotion()
  const level = getPerformanceLevel()

  useEffect(() => {
    const wrap = wrapRef.current
    const img = imgRef.current
    if (!wrap || !img || reducedMotion) return

    const cleanups: Array<() => void> = []
    if (reveal) cleanups.push(revealImage(wrap))
    if (level !== 'low') cleanups.push(parallaxY(img, { from: -speed, to: speed }))
    if (slowZoom && level === 'high') cleanups.push(kenBurns(img, 1.06, 26))

    return () => {
      for (const fn of cleanups) fn()
    }
  }, [speed, slowZoom, reveal, reducedMotion, level])

  return (
    <figure
      ref={(node) => {
        wrapRef.current = node
      }}
      className={`relative overflow-hidden ${className}`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={loading}
        decoding="async"
        draggable={false}
        className={`absolute inset-0 h-full w-full object-cover will-change-transform ${imgClassName}`}
        style={{ transform: reducedMotion ? undefined : 'scale(1.16)' }}
      />
    </figure>
  )
}
