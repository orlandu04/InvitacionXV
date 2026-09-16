import { motion } from 'framer-motion'
import { useLayoutEffect, useRef, useState } from 'react'

import gallery1 from '../assets/images/gallery-1.svg'
import gallery2 from '../assets/images/gallery-2.svg'
import gallery3 from '../assets/images/gallery-3.svg'
import heroImg from '../assets/images/hero.svg'
import { Petals } from '../components/effects/Petals'
import { Sparkles } from '../components/effects/Sparkles'
import { GlowButton } from '../components/ui/GlowButton'
import { invitation } from '../config/invitation'
import { useInvitation } from '../hooks/useInvitation'

/* ── Precarga de recursos críticos con progreso real ─────── */

function criticalImageSources(): string[] {
  return [heroImg, gallery1, gallery2, gallery3]
}

async function preloadCritical(onProgress: (ratio: number) => void): Promise<void> {
  const srcs = criticalImageSources()
  let loaded = 0
  if (srcs.length === 0) {
    onProgress(1)
    return
  }
  await Promise.allSettled(
    srcs.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image()
          const done = (): void => {
            loaded += 1
            onProgress(loaded / srcs.length)
            resolve()
          }
          img.onload = done
          img.onerror = done
          img.src = src
        }),
    ),
  )
}

/* ── Pantalla de carga + Bienvenida cinematográfica ───────── */

const MIN_LOAD_MS = 1500
const MAX_LOAD_MS = 3500

const EASE = [0.22, 1, 0.36, 1] as const

export function Intro(): React.JSX.Element {
  const { openInvitation, audio } = useInvitation()
  const [phase, setPhase] = useState<'loading' | 'welcome'>('loading')
  const [progress, setProgress] = useState(0)
  const [opening, setOpening] = useState(false)
  const startedAt = useRef<number | null>(null)

  useLayoutEffect(() => {
    let cancelled = false
    startedAt.current ??= Date.now()

    const timeout = window.setTimeout(() => !cancelled && setPhase('welcome'), MAX_LOAD_MS)

    void preloadCritical((ratio) => {
      if (!cancelled) setProgress(ratio)
    }).then(() => {
      if (cancelled) return
      const elapsed = Date.now() - (startedAt.current ?? Date.now())
      const wait = Math.max(0, MIN_LOAD_MS - elapsed)
      window.clearTimeout(timeout)
      window.setTimeout(() => !cancelled && setPhase('welcome'), wait)
    })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  const handleOpen = (): void => {
    if (opening) return
    audio.play()
    setOpening(true)
    // ráfaga de luz antes de revelar la experiencia
    window.setTimeout(() => openInvitation(), 480)
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] overflow-hidden bg-gradient-to-b from-rose-pastel via-blush to-champagne grain"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.07, filter: 'blur(10px)' }}
      transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
    >
      <Sparkles density={1.2} />
      <Petals density={0.6} />

      {/* ráfaga al abrir */}
      {opening && (
        <motion.div
          className="absolute inset-0 z-30"
          style={{
            background:
              'radial-gradient(circle at center, rgba(255,247,237,0.95), rgba(212,175,55,0.35) 45%, transparent 72%)',
          }}
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 1, 1], scale: 3.2 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}

      {phase === 'loading' ? (
        <Loader progress={progress} />
      ) : (
        <Welcome opening={opening} onOpen={handleOpen} />
      )}
    </motion.div>
  )
}

/* ── Loader ─────────────────────────────────────────────────── */

function Loader({ progress }: { progress: number }): React.JSX.Element {
  return (
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="relative"
      >
        <span className="text-gilded font-script block text-[clamp(6rem,22vw,10rem)] leading-none drop-shadow-[0_2px_18px_rgba(212,175,55,0.35)]">
          {invitation.initials}
        </span>
        {/* anillo de destellos */}
        {[...Array(6)].map((_, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="absolute h-3 w-3 text-gold"
            style={{
              left: `${50 + 46 * Math.cos((i / 6) * Math.PI * 2)}%`,
              top: `${50 + 40 * Math.sin((i / 6) * Math.PI * 2)}%`,
              animation: `twinkle ${2 + i * 0.4}s ease-in-out ${i * 0.35}s infinite`,
            }}
          >
            <path d="M12 0c.9 6.8 4.3 10.2 12 12-7.7 1.8-11.1 5.2-12 12-.9-6.8-4.3-10.2-12-12C7.7 10.2 11.1 6.8 12 0Z" />
          </svg>
        ))}
      </motion.div>

      <motion.p
        initial={{ opacity: 0, letterSpacing: '0.2em' }}
        animate={{ opacity: 1, letterSpacing: '0.55em' }}
        transition={{ delay: 0.5, duration: 1.2, ease: 'easeOut' }}
        className="mt-6 pl-[0.55em] font-display text-sm uppercase text-rose-deep sm:text-base"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {invitation.name}
      </motion.p>

      {/* progreso */}
      <div className="mt-10 h-px w-44 overflow-hidden rounded-full bg-rose-deep/15">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-deep via-gold to-gold-light"
          animate={{ width: `${Math.round(progress * 100)}%` }}
          transition={{ ease: 'easeOut', duration: 0.4 }}
        />
      </div>
    </div>
  )
}

/* ── Welcome ────────────────────────────────────────────────── */

const welcomeContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.28, delayChildren: 0.25 } },
}

const welcomeItem = {
  hidden: { opacity: 0, y: 34, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 1, ease: [0.22, 1, 0.36, 1] as const },
  },
}

const NAME = invitation.name.toUpperCase()

function Welcome({
  opening,
  onOpen,
}: {
  opening: boolean
  onOpen: () => void
}): React.JSX.Element {
  return (
    <motion.div className="relative z-10 flex h-full flex-col items-center px-6 py-[max(4vh,20px)] text-center">
      {/* Zona superior: contenido repartido con aire entre elementos */}
      <motion.div
        variants={welcomeContainer}
        initial="hidden"
        animate="show"
        className="flex w-full flex-1 flex-col items-center justify-evenly"
      >
        <motion.p variants={welcomeItem} className="font-display text-xl italic text-rose-dark/90 sm:text-2xl">
          {invitation.welcome.message}
        </motion.p>

        <motion.h1
          variants={welcomeItem}
          className="text-gilded type-script-hero drop-shadow-[0_2px_20px_rgba(190,24,93,0.25)]"
        >
          {NAME}
        </motion.h1>

        <motion.div variants={welcomeItem} className="flex items-center gap-4" aria-hidden="true">
          <span className="gold-hairline w-14 sm:w-20" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <span className="gold-hairline w-14 sm:w-20" />
        </motion.div>

        <motion.p
          variants={welcomeItem}
          className="font-display text-xl font-medium tracking-[0.5em] text-rose-deep sm:text-2xl"
        >
          XV AÑOS
        </motion.p>

        <motion.p variants={welcomeItem} className="eyebrow text-ink/60">
          28 · Noviembre · 2026
        </motion.p>
      </motion.div>

      {/* Botón anclado en la parte baja */}
      <motion.div
        className="mt-[5vh] pb-[3vh]"
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.6, duration: 0.8, ease: EASE }}
      >
        <GlowButton variant="gold" onClick={onOpen} ariaLabel="Abrir la invitación" className="!px-12 !py-5">
          {opening ? 'Un momento…' : invitation.welcome.buttonLabel}
        </GlowButton>
      </motion.div>
    </motion.div>
  )
}
