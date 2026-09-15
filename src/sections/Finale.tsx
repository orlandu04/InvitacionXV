import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useLayoutEffect, useRef } from 'react'

import { Petals } from '../components/effects/Petals'
import { Sparkles } from '../components/effects/Sparkles'
import { invitation } from '../config/invitation'
import { social } from '../config/social'
import { useReducedMotion } from '../hooks/useReducedMotion'

gsap.registerPlugin(ScrollTrigger)

/**
 * Final cinematográfico: la pantalla se oscurece, aparecen pétalos y
 * la secuencia "Gracias → TANIA → XV → Con cariño" se revela con el
 * scroll, cerrando con un destello dorado.
 */
export function Finale(): React.JSX.Element {
  const outerRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  useLayoutEffect(() => {
    const outer = outerRef.current
    if (!outer || reducedMotion) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: outer,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.65,
        },
        defaults: { ease: 'power2.out' },
      })

      /* 1 · Agradecimiento */
      tl.fromTo('.finale-thanks', { opacity: 0, y: 70, filter: 'blur(8px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.09 }, 0.03)
        .to({}, { duration: 0.07 })
        .to('.finale-thanks', { opacity: 0, y: -60, filter: 'blur(6px)', duration: 0.07 }, 0.19)

      /* 2 · Nombre */
      .fromTo('.finale-name', { opacity: 0, scale: 0.82, filter: 'blur(14px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.13 }, 0.27)
      .to({}, { duration: 0.1 })

      /* 3 · Monograma XV — el nombre asciende y cede protagonismo */
      .to('.finale-name', { yPercent: -34, scale: 0.62, duration: 0.11 }, 0.5)
      .fromTo('.finale-xv', { opacity: 0, scale: 0.5, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: 0.11 }, 0.52)

      /* 4 · Firma */
      .to({}, { duration: 0.06 })
      .fromTo('.finale-signature', { opacity: 0, y: 44 }, { opacity: 1, y: 0, duration: 0.1 }, 0.7)

      /* 5 · Brillo final */
      .to({}, { duration: 0.05 })
      .fromTo('.finale-glow', { opacity: 0, scale: 0.4 }, { opacity: 0.9, scale: 1.6, duration: 0.06 }, 0.86)
      .to('.finale-glow', { opacity: 0, scale: 2.4, duration: 0.08 })
    }, outer)

    return () => ctx.revert()
  }, [reducedMotion])

  if (reducedMotion) {
    return (
      <section ref={outerRef} id="finale" aria-label="Agradecimiento" className="grain relative overflow-hidden bg-ink py-28 text-center">
        <div className="relative z-10 mx-auto max-w-xl space-y-8 px-6">
          <p className="font-display text-2xl italic text-blush/90">{invitation.finale.thanks}</p>
          <h2 className="type-script-hero text-gilded">{invitation.name}</h2>
          <p className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/70 font-display text-xl tracking-widest text-gold-light">XV</p>
          <p className="font-script text-3xl text-rose-pastel">{invitation.finale.signature}</p>
          <p className="font-display text-sm uppercase tracking-[0.3em] text-blush/60">{invitation.finale.family}</p>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={outerRef}
      id="finale"
      aria-label="Agradecimiento final"
      className="grain relative bg-gradient-to-b from-ink via-[#241521] to-ink"
      style={{ height: '300vh' }}
    >
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* aura rosa profunda */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[42rem] w-[42rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(190,24,93,0.22), transparent 62%)' }}
        />

        <Sparkles density={1.1} />
        <Petals density={1.5} />

        {/* destello final */}
        <div
          className="finale-glow pointer-events-none absolute left-1/2 top-1/2 h-[30vmax] w-[30vmax] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0"
          style={{
            background:
              'radial-gradient(circle, rgba(246,226,122,0.55), rgba(212,175,55,0.25) 40%, transparent 68%)',
            mixBlendMode: 'screen',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 h-screen w-full text-center">
          {/* 1 */}
          <p className="finale-thanks absolute inset-0 flex items-center justify-center px-6 font-display text-3xl font-light italic text-blush sm:text-5xl">
            “{invitation.finale.thanks}”
          </p>

          {/* 2 + 3 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6">
            <h2 className="type-script-hero finale-name text-gilded leading-none drop-shadow-[0_4px_30px_rgba(212,175,55,0.4)] will-change-transform">
              {invitation.name}
            </h2>
            <div className="finale-xv mt-6 flex h-24 w-24 items-center justify-center rounded-full border border-gold/70 shadow-[0_0_36px_rgba(212,175,55,0.35)] sm:h-28 sm:w-28">
              <span className="font-display text-3xl font-medium tracking-[0.18em] text-gold-light sm:text-4xl">
                XV
              </span>
            </div>
          </div>

          {/* 4 */}
          <div className="finale-signature absolute inset-0 flex flex-col items-center justify-center gap-4 px-6 opacity-0">
            <p className="font-script text-4xl text-rose-pastel sm:text-5xl">{invitation.finale.signature}</p>
            <p className="font-display text-sm uppercase tracking-[0.34em] text-blush/75 sm:text-base">
              {invitation.finale.family}
            </p>
          </div>

          {/* pie */}
          <footer className="absolute bottom-7 left-0 right-0 z-10 flex flex-col items-center gap-2 opacity-90">
            <span className="gold-hairline w-16" aria-hidden="true" />
            <p className="text-[0.6rem] uppercase tracking-[0.4em] text-blush/45">
              {social.hashtag} · Invitación digital
            </p>
          </footer>
        </div>
      </div>
    </section>
  )
}
