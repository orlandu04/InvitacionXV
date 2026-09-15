import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'

import { parallaxY } from '../animations/effects'
import { FloralDecoration } from '../components/effects/FloralDecoration'
import { Petals } from '../components/effects/Petals'
import { ParallaxImage } from '../components/ui/ParallaxImage'
import { ScrollIndicator } from '../components/ui/ScrollIndicator'
import { getPerformanceLevel } from '../hooks/usePerformance'
import { useReducedMotion } from '../hooks/useReducedMotion'

import { invitation } from '../config/invitation'
import heroImg from '../assets/images/hero.svg'

gsap.registerPlugin(ScrollTrigger)

/**
 * Hero cinematográfico: fotografía con parallax + zoom perpetuo,
 * timeline de entrada orquestado con GSAP y salida con blur sutil.
 */
export function Hero(): React.JSX.Element {
  const sectionRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const level = getPerformanceLevel()

  useLayoutEffect(() => {
    const section = sectionRef.current
    const content = contentRef.current
    if (!section) return

    if (reducedMotion) return

    const ctx = gsap.context(() => {
      /* Timeline de entrada */
      const tl = gsap.timeline({ delay: 0.35 })
      tl.fromTo(contentRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6 })
        .fromTo(
          '.hero-eyebrow',
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out' },
          '-=0.2',
        )
        .fromTo(
          '.hero-name',
          { opacity: 0, y: 70, scale: 0.94, filter: 'blur(10px)' },
          { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', duration: 1.5, ease: 'power3.out' },
          '-=0.55',
        )
        .fromTo(
          '.hero-tagline',
          { opacity: 0, y: 26 },
          { opacity: 1, y: 0, duration: 1, ease: 'power3.out' },
          '-=0.9',
        )
        .fromTo(
          '.hero-divider',
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: 'power2.inOut', transformOrigin: 'center' },
          '-=0.7',
        )
        .fromTo('.hero-scroll', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')

      /* Salida cinematográfica al hacer scroll */
      gsap.to(content, {
        yPercent: -26,
        opacity: 0,
        filter: level === 'low' ? undefined : 'blur(7px)',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '82% top',
          scrub: 0.5,
        },
      })

      parallaxY('.hero-bg', { from: -4, to: 10, scrub: 0.5, trigger: section })
    }, section)

    return () => ctx.revert()
  }, [reducedMotion, level])

  return (
    <section
      ref={sectionRef}
      id="hero"
      aria-label={`${invitation.name} — ${invitation.title}`}
      className="relative h-[100svh] overflow-hidden bg-ink"
    >
      {/* Fotografía principal */}
      <div className="hero-bg absolute inset-[-6%]">
        <ParallaxImage
          src={heroImg}
          alt={`Retrato principal de ${invitation.name} en su vestido de XV años`}
          loading="eager"
          slowZoom
          speed={0}
          reveal={false}
          className="h-full w-full"
        />
      </div>

      {/* Veladuras cinematográficas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-ink/45 via-rose-dark/20 to-ink/75"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 42%, rgba(23,18,23,0.55) 100%)',
        }}
      />

      <Petals density={0.8} />

      {/* Composición editorial floral */}
      <FloralDecoration variant="corner" from="left" width={150} drift={26} className="-left-8 top-16 opacity-80 sm:w-[190px]" />
      <FloralDecoration variant="sprig" from="right" width={120} drift={40} flipX flipY className="-right-4 bottom-24 opacity-70 sm:w-[150px]" />

      {/* Contenido */}
      <div ref={contentRef} className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="hero-eyebrow eyebrow text-gold-light drop-shadow-md">{invitation.title}</p>

        <h1 className="type-script-hero hero-name text-gilded mt-3 drop-shadow-[0_4px_28px_rgba(212,175,55,0.35)]">
          {invitation.name}
        </h1>

        <div className="hero-divider mt-5 flex items-center gap-4" aria-hidden="true">
          <span className="gold-hairline w-16 sm:w-24" />
          <span className="h-2 w-2 rotate-45 border border-gold bg-transparent" />
          <span className="gold-hairline w-16 sm:w-24" />
        </div>

        <p className="hero-tagline mt-5 font-display text-lg italic tracking-wide text-blush/95 sm:text-2xl">
          {invitation.tagline}
        </p>
      </div>

      {/* Indicador de scroll */}
      <div className="hero-scroll absolute bottom-7 left-0 right-0 z-10 motion-reduce:hidden">
        <ScrollIndicator target="#gallery" />
      </div>
    </section>
  )
}
