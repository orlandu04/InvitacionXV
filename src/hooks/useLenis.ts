import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { useEffect } from 'react'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance: Lenis | null = null

/** Acceso global al scroll suave (para scrollTo desde cualquier componente) */
export function getLenis(): Lenis | null {
  return lenisInstance
}

/**
 * Activa Lenis sincronizado con GSAP ScrollTrigger.
 * `enabled=false` mientras la invitación está cerrada (intro bloqueada).
 */
export function useLenis(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      touchMultiplier: 1.3,
      easing: (t: number): number => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    lenisInstance = lenis

    lenis.on('scroll', ScrollTrigger.update)
    const raf = (time: number): void => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)
    ScrollTrigger.refresh()

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      lenisInstance = null
    }
  }, [enabled])
}

/** Desplazamiento elegante hacia un selector o posición */
export function scrollToSection(selector: string): void {
  const lenis = getLenis()
  if (lenis) lenis.scrollTo(selector, { duration: 1.6 })
  else document.querySelector(selector)?.scrollIntoView({ behavior: 'smooth' })
}
