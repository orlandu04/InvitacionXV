import { CalendarDays, Clock3, Gem, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

import { FloralDecoration } from '../components/effects/FloralDecoration'
import { invitation } from '../config/invitation'

const ICONS = {
  calendar: CalendarDays,
  clock: Clock3,
  mapPin: MapPin,
  gem: Gem,
} as const

const EASE = [0.22, 1, 0.36, 1] as const

/** Deriva las partes de la fecha desde la ÚNICA fuente de verdad: eventDate */
function getDateParts(): { weekday: string; day: string; month: string; year: string } {
  const date = new Date(`${invitation.eventDate}`)
  const fmt = (options: Intl.DateTimeFormatOptions): string =>
    new Intl.DateTimeFormat('es-MX', options).format(date)
  return {
    weekday: fmt({ weekday: 'long' }),
    day: String(date.getDate()).padStart(2, '0'),
    month: fmt({ month: 'long' }),
    year: String(date.getFullYear()),
  }
}

/**
 * "El gran día": composición editorial tipográfica — fecha monumental
 * y detalles del evento en columna con iconografía fina.
 */
export function Event(): React.JSX.Element {
  const { weekday, day, month, year } = getDateParts()

  return (
    <section
      id="event"
      aria-label="El gran día"
      className="grain relative overflow-hidden bg-gradient-to-b from-white via-blush to-rose-pastel/40 py-24 sm:py-36"
    >
      <FloralDecoration variant="sprig" from="top" width={120} drift={22} flipX className="right-[8%] top-16 opacity-70" />

      <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-14 px-6 md:grid-cols-2 md:gap-10">
        {/* Fecha monumental */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: EASE }}
          className="text-center md:text-left"
        >
          <p className="eyebrow text-gold-deep">{invitation.event.eyebrow}</p>
          <div className="mt-4 flex items-end justify-center gap-4 md:justify-start">
            <span className="type-display-xl text-gilded font-semibold leading-none">{day}</span>
            <div className="pb-2 text-left">
              <span className="block font-script text-4xl capitalize text-rose-deep sm:text-5xl">
                {month}
              </span>
              <span className="mt-1 block font-display text-lg tracking-[0.4em] text-ink/70">
                {year}
              </span>
            </div>
          </div>
          <div className="gold-hairline mx-auto mt-6 w-32 md:mx-0" aria-hidden="true" />
          <p className="mt-4 font-display text-sm italic capitalize text-ink/55">
            {weekday} · {invitation.ceremony.time}
          </p>
        </motion.div>

        {/* Detalles */}
        <ul className="space-y-7">
          {invitation.event.details.map((detail, index) => {
            const Icon = ICONS[detail.icon]
            return (
              <motion.li
                key={detail.label}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.85, delay: index * 0.12, ease: EASE }}
                className="flex items-start gap-5 border-b border-rose-pastel/60 pb-6 last:border-none last:pb-0"
              >
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold/60 bg-white/70 text-gold-deep shadow-sm"
                >
                  <Icon size={18} strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block text-[0.62rem] font-medium uppercase tracking-[0.35em] text-rose-deep/80">
                    {detail.label}
                  </span>
                  <span className="mt-1.5 block font-body text-[0.95rem] font-medium text-ink/85">
                    {detail.value}
                  </span>
                </span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
