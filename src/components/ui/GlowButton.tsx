import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useCallback, useRef, type MouseEvent, type ReactNode } from 'react'

interface GlowButtonProps {
  children: ReactNode
  onClick?: () => void
  href?: string
  variant?: 'gold' | 'outline' | 'outline-light'
  className?: string
  ariaLabel?: string
}

const VARIANTS: Record<NonNullable<GlowButtonProps['variant']>, string> = {
  gold: 'bg-gradient-to-r from-champagne via-gold to-champagne text-ink shadow-[0_0_28px_rgba(212,175,55,0.38)] hover:shadow-[0_0_44px_rgba(212,175,55,0.6)]',
  outline:
    'bg-white/40 border border-gold/70 text-gold-deep shadow-[0_0_18px_rgba(212,175,55,0.18)] hover:bg-white/60',
  'outline-light':
    'bg-white/[0.04] border border-gold/80 text-gold-light shadow-[0_0_22px_rgba(212,175,55,0.25)] hover:bg-gold/15',
}

/**
 * Botón premium: brillo dorado, barrido de luz al hover,
 * efecto magnético en desktop y micro-escala al presionar.
 */
export function GlowButton({
  children,
  onClick,
  href,
  variant = 'outline',
  className = '',
  ariaLabel,
}: GlowButtonProps): React.JSX.Element {
  const ref = useRef<HTMLElement | null>(null)
  const reducedMotion = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 220, damping: 18 })
  const y = useSpring(my, { stiffness: 220, damping: 18 })

  const handleMove = useCallback(
    (event: MouseEvent): void => {
      if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const relX = event.clientX - (rect.left + rect.width / 2)
      const relY = event.clientY - (rect.top + rect.height / 2)
      mx.set(relX * 0.16)
      my.set(relY * 0.22)
    },
    [mx, my, reducedMotion],
  )

  const reset = useCallback((): void => {
    mx.set(0)
    my.set(0)
  }, [mx, my])

  const shared =
    'group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full px-9 py-4 font-body text-[0.68rem] sm:text-xs font-semibold uppercase tracking-[0.32em] transition-shadow duration-500 select-none'

  const inner = (
    <>
      {/* barrido de luz */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 -translate-x-[130%] skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 group-hover:[animation:shine-sweep_1.2s_ease-in-out_infinite]"
      />
      <span className="relative z-10 inline-flex items-center gap-3">{children}</span>
    </>
  )

  const style = { x, y }

  if (href) {
    return (
      <motion.a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        style={style}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        whileHover={reducedMotion ? undefined : { scale: 1.045 }}
        whileTap={reducedMotion ? undefined : { scale: 0.96 }}
        className={`${shared} ${VARIANTS[variant]} ${className}`}
      >
        {inner}
      </motion.a>
    )
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      whileHover={reducedMotion ? undefined : { scale: 1.045 }}
      whileTap={reducedMotion ? undefined : { scale: 0.95 }}
      className={`${shared} ${VARIANTS[variant]} ${className}`}
    >
      {inner}
    </motion.button>
  )
}
