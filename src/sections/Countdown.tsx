import { AnimatePresence, motion } from 'framer-motion'
import { useCountdown } from '../hooks/useCountdown'

import { SectionTitle } from '../components/ui/SectionTitle'
import { invitation } from '../config/invitation'

const EASE = [0.22, 1, 0.36, 1] as const

/** Número cuya cifra se desliza suavemente al cambiar */
function AnimatedNumber({ value }: { value: string }): React.JSX.Element {
  return (
    <span className="relative block h-[1.15em] overflow-hidden" aria-hidden="true">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: '70%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-70%', opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="block tabular-nums"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

const UNITS = [
  { key: 'days', label: 'Días' },
  { key: 'hours', label: 'Horas' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'seconds', label: 'Segundos' },
] as const

/**
 * Cuenta regresiva en vivo hacia la fecha central del evento.
 * Los dígitos cambian con una micro-animación elegante.
 */
export function Countdown(): React.JSX.Element {
  const countdown = useCountdown(invitation.eventDate)

  return (
    <section
      id="countdown"
      aria-label="Cuenta regresiva para el evento"
      className="grain relative overflow-hidden bg-gradient-to-b from-champagne via-blush to-white py-24 sm:py-36"
    >
      {/* halo rosa superior */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-56 w-[130%] -translate-x-1/2 blur-3xl"
        style={{ background: 'radial-gradient(ellipse, rgba(249,168,212,0.35), transparent 65%)' }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <SectionTitle eyebrow="Cuenta regresiva" title={countdown.isPast ? '¡Es hoy!' : 'Faltan'} />

        {countdown.isPast ? (
          <p className="mt-10 font-script text-4xl text-rose-deep sm:text-5xl">
            ¡Hoy celebro mis XV años!
          </p>
        ) : (
          <>
            <div
              className="mt-14 grid grid-cols-4 gap-3 sm:gap-6"
              role="timer"
              aria-live="off"
              aria-label={`Faltan ${countdown.days} días, ${countdown.hours} horas, ${countdown.minutes} minutos y ${countdown.seconds} segundos`}
            >
              {UNITS.map((unit) => (
                <motion.div
                  key={unit.key}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="glass-light rounded-2xl px-1 py-5 shadow-[0_18px_40px_-16px_rgba(190,24,93,0.25)] sm:py-8"
                >
                  <span className="block font-display text-[8.5vw] font-semibold leading-none text-rose-dark sm:text-6xl lg:text-7xl">
                    <AnimatedNumber value={countdown[unit.key]} />
                  </span>
                  <span className="mt-3 block text-[0.55rem] font-medium uppercase tracking-[0.32em] text-rose-deep sm:text-[0.62rem]">
                    {unit.label}
                  </span>
                </motion.div>
              ))}
            </div>

            <p className="mt-12 font-display text-base italic text-ink/60 sm:text-lg">
              para brindar juntos bajo las estrellas
            </p>
          </>
        )}
      </div>
    </section>
  )
}
