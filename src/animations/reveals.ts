import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export interface RevealOptions {
  /** Retardo en segundos */
  delay?: number
  duration?: number
  ease?: string
  /** Dispara al entrar en viewport en vez de inmediato */
  scroll?: boolean
  trigger?: Element | string
  start?: string
}

/** Estados iniciales compartidos (usar con gsap.fromTo / timelines) */
export const fromFadeUp = (y = 80): gsap.TweenVars => ({ opacity: 0, y })
export const fromFade = (): gsap.TweenVars => ({ opacity: 0 })
export const fromScale = (s = 0.86): gsap.TweenVars => ({ opacity: 0, scale: s })

/** Resuelve un disparador DOM válido para ScrollTrigger */
function resolveTrigger(
  target: gsap.TweenTarget,
  opts: RevealOptions,
): Element | string | undefined {
  if (opts.trigger) return opts.trigger
  const first = Array.isArray(target) ? target[0] : target
  return first instanceof Element ? first : undefined
}

interface ScrollVars {
  scrollTrigger?: {
    trigger?: Element | string | null
    start?: string
    once?: boolean
    scrub?: number | boolean
    pin?: boolean
    end?: string
    anticipatePin?: number
  }
}

/** Fade simple, inmediato o ligado a scroll */
export function fadeIn(target: gsap.TweenTarget, opts: RevealOptions = {}): () => void {
  const ctx = gsap.context(() => {
    gsap.fromTo(
      target,
      { opacity: 0 },
      {
        opacity: 1,
        duration: opts.duration ?? 1.1,
        delay: opts.delay ?? 0,
        ease: opts.ease ?? 'power2.out',
        ...(opts.scroll || opts.trigger
          ? ({
              scrollTrigger: {
                trigger: resolveTrigger(target, opts),
                start: opts.start ?? 'top 82%',
                once: true,
              },
            } satisfies ScrollVars)
          : {}),
      },
    )
  })
  return () => ctx.revert()
}

/** Aparición con desplazamiento vertical ascendente */
export function fadeUp(target: gsap.TweenTarget, opts: RevealOptions = {}): () => void {
  const ctx = gsap.context(() => {
    gsap.fromTo(
      target,
      { opacity: 0, y: 80 },
      {
        opacity: 1,
        y: 0,
        duration: opts.duration ?? 1.2,
        delay: opts.delay ?? 0,
        ease: opts.ease ?? 'power3.out',
        ...(opts.scroll || opts.trigger
          ? ({
              scrollTrigger: {
                trigger: resolveTrigger(target, opts),
                start: opts.start ?? 'top 84%',
                once: true,
              },
            } satisfies ScrollVars)
          : {}),
      },
    )
  })
  return () => ctx.revert()
}

/** Entrada escalonada de los hijos de un contenedor */
export function staggerChildren(
  container: Element | string,
  itemSelector: string,
  opts: RevealOptions & { stagger?: number } = {},
): () => void {
  const ctx = gsap.context(() => {
    const selector =
      typeof container === 'string' ? `${container} ${itemSelector}` : itemSelector
    gsap.fromTo(
      selector,
      { opacity: 0, y: 56 },
      {
        opacity: 1,
        y: 0,
        duration: opts.duration ?? 1,
        delay: opts.delay ?? 0,
        stagger: opts.stagger ?? 0.12,
        ease: 'power3.out',
        ...(opts.scroll || !opts.delay
          ? ({
              scrollTrigger: {
                trigger: container,
                start: opts.start ?? 'top 82%',
                once: true,
              },
            } satisfies ScrollVars)
          : {}),
      },
    )
  }, container instanceof Element ? container : undefined)
  return () => ctx.revert()
}

/** Escala suave de entrada */
export function scaleIn(target: gsap.TweenTarget, opts: RevealOptions = {}): () => void {
  const ctx = gsap.context(() => {
    gsap.fromTo(
      target,
      { opacity: 0, scale: 0.86 },
      {
        opacity: 1,
        scale: 1,
        duration: opts.duration ?? 1.2,
        delay: opts.delay ?? 0,
        ease: opts.ease ?? 'power3.out',
        ...(opts.scroll || opts.trigger
          ? ({
              scrollTrigger: {
                trigger: resolveTrigger(target, opts),
                start: opts.start ?? 'top 82%',
                once: true,
              },
            } satisfies ScrollVars)
          : {}),
      },
    )
  })
  return () => ctx.revert()
}
