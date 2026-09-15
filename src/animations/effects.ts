import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/** Parallax vertical ligado al scroll — profundidad sin mareo */
export function parallaxY(
  target: gsap.TweenTarget,
  opts: { from?: number; to?: number; scrub?: number | boolean; trigger?: Element | string } = {},
): () => void {
  const fallbackTrigger =
    Array.isArray(target)
      ? (target.find((t) => t instanceof Element) as Element | undefined)
      : target instanceof Element
        ? target
        : undefined
  const ctx = gsap.context(() => {
    gsap.fromTo(
      target,
      { yPercent: opts.from ?? -8 },
      {
        yPercent: opts.to ?? 8,
        ease: 'none',
        scrollTrigger: {
          trigger: opts.trigger ?? fallbackTrigger,
          start: 'top bottom',
          end: 'bottom top',
          scrub: opts.scrub ?? 0.6,
        },
      },
    )
  })
  return () => ctx.revert()
}

/** Zoom cinematográfico perpetuo, muy lento (Ken Burns) */
export function kenBurns(target: gsap.TweenTarget, scaleTo = 1.08, duration = 22): () => void {
  const tween = gsap.fromTo(
    target,
    { scale: 1 },
    {
      scale: scaleTo,
      duration,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    },
  )
  return () => {
    tween.kill()
  }
}

/**
 * Revelado editorial de fotografía:
 * máscara clip-path que se abre + escala interna 1.25 → 1.
 */
export function revealImage(
  wrap: HTMLElement,
  imgSelector = 'img',
  opts: { start?: string; once?: boolean } = {},
): () => void {
  const ctx = gsap.context(() => {
    const img = wrap.querySelector(imgSelector)
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: opts.start ?? 'top 80%',
        once: opts.once ?? true,
      },
    })
    tl.fromTo(wrap, { clipPath: 'inset(12% 6% 12% 6% round 14px)', opacity: 0.4 }, {
      clipPath: 'inset(0% 0% 0% 0% round 14px)',
      opacity: 1,
      duration: 1.3,
      ease: 'power3.inOut',
    })
    if (img) tl.fromTo(img, { scale: 1.28 }, { scale: 1, duration: 1.7, ease: 'power2.out' }, '<')
  }, wrap)
  return () => ctx.revert()
}

/** Divide texto en spans por carácter (para animación tipográfica) */
export function splitIntoChars(el: HTMLElement): HTMLElement[] {
  const text = el.textContent ?? ''
  el.textContent = ''
  el.setAttribute('aria-label', text)
  const spans: HTMLElement[] = []
  for (const char of text) {
    const span = document.createElement('span')
    span.textContent = char === ' ' ? '\u00A0' : char
    span.setAttribute('aria-hidden', 'true')
    span.style.display = 'inline-block'
    el.appendChild(span)
    spans.push(span)
  }
  return spans
}

/** Animación de caracteres: suben con stagger y brillo final */
export function animateCharsIn(el: HTMLElement, opts: { delay?: number; stagger?: number } = {}): () => void {
  const chars = splitIntoChars(el)
  const tween = gsap.fromTo(
    chars,
    { opacity: 0, y: 46, rotateX: -40, filter: 'blur(6px)' },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      filter: 'blur(0px)',
      duration: 1.15,
      delay: opts.delay ?? 0,
      stagger: opts.stagger ?? 0.055,
      ease: 'power3.out',
    },
  )
  return () => {
    tween.kill()
  }
}

/**
 * Transición tipo cortina: dos paneles entran desde los lados,
 * se encuentran al centro y luego se abren revelando la sección.
 * Requiere estructura: contenedor + dos .curtain-panel.
 */
export function curtainTimeline(
  section: HTMLElement,
  opts: { monogram?: HTMLElement | null } = {},
): () => void {
  const ctx = gsap.context(() => {
    const panels = section.querySelectorAll<HTMLElement>('.curtain-panel')
    if (!panels.length) return

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=140%',
        pin: true,
        scrub: 0.7,
        anticipatePin: 1,
      },
    })

    tl.fromTo(panels, { xPercent: (i) => (i === 0 ? -100 : 100) }, { xPercent: 0, ease: 'power2.inOut', duration: 1 })
    if (opts.monogram) {
      tl.fromTo(opts.monogram, { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }, '-=0.35')
    }
    tl.to({}, { duration: 0.45 }) // pausa dramática con paneles cerrados
    if (opts.monogram) tl.to(opts.monogram, { opacity: 0, scale: 1.25, duration: 0.4 }, 'open')
    tl.to(panels, { xPercent: (i) => (i === 0 ? -100 : 100), ease: 'power2.inOut', duration: 1 }, 'open')
  }, section)
  return () => ctx.revert()
}
