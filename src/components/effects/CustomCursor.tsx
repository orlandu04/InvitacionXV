import { useEffect, useRef, useState } from 'react'

/**
 * Cursor personalizado premium (SOLO desktop con puntero fino):
 * anillo exterior con inercia + punto central preciso.
 * Se expande sobre elementos interactivos y se oculta en táctiles.
 */
export function CustomCursor(): React.JSX.Element | null {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [enabled] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(pointer: fine)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    if (!enabled) return

    document.documentElement.classList.add('has-custom-cursor')

    const pos = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let hovering = false
    let visible = false
    let rafId = 0

    const onMove = (event: PointerEvent): void => {
      pos.x = event.clientX
      pos.y = event.clientY
      if (!visible) {
        visible = true
        if (dotRef.current) dotRef.current.style.opacity = '1'
        if (ringRef.current) ringRef.current.style.opacity = '1'
      }
      const target = event.target as Element | null
      hovering = Boolean(target?.closest?.('a, button, [data-cursor-hover], input, textarea, select'))
    }

    const onLeave = (): void => {
      visible = false
      if (dotRef.current) dotRef.current.style.opacity = '0'
      if (ringRef.current) ringRef.current.style.opacity = '0'
    }

    const render = (): void => {
      ring.x += (pos.x - ring.x) * 0.16
      ring.y += (pos.y - ring.y) * 0.16

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        const scale = hovering ? 2 : 1
        ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0) translate(-50%, -50%) scale(${scale})`
        ringRef.current.style.borderColor = hovering ? 'rgba(212,175,55,0.9)' : 'rgba(236,72,153,0.55)'
        ringRef.current.style.backgroundColor = hovering ? 'rgba(212,175,55,0.08)' : 'transparent'
      }
      rafId = requestAnimationFrame(render)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    rafId = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.classList.remove('has-custom-cursor')
    }
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-gold opacity-0 transition-opacity duration-300"
      />
      <div
        ref={ringRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-[9998] h-9 w-9 rounded-full border opacity-0 transition-opacity duration-300 will-change-transform"
      />
    </>
  )
}
