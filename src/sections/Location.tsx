import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

import { GlowButton } from '../components/ui/GlowButton'
import { invitation } from '../config/invitation'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Ceremonia y recepción sobre fondo profundo con marca de agua.
 * Cada tarjeta abre su propia ubicación en Google Maps desde la configuración.
 */
export function Location(): React.JSX.Element {
  const places = [
    {
      eyebrow: invitation.ceremony.eyebrow,
      venue: invitation.ceremony.venue,
      address: invitation.ceremony.address,
      time: invitation.ceremony.time,
      mapsUrl: invitation.ceremony.mapsUrl,
    },
    {
      eyebrow: invitation.location.eyebrow,
      venue: invitation.location.venue,
      address: invitation.location.address,
      time: invitation.location.time,
      mapsUrl: invitation.location.mapsUrl,
    },
  ]

  return (
    <section
      id="location"
      aria-label="Ceremonia y recepción"
      className="grain relative overflow-hidden bg-gradient-to-b from-ink via-rose-dark to-rose-deep py-24 text-center sm:py-36"
    >
      {/* marca de agua */}
      <MapPin
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 text-blush/[0.05]"
        strokeWidth={0.5}
      />

      {/* halo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.22), transparent 65%)' }}
      />

      <div className="relative z-10 mx-auto max-w-4xl px-6">
        <div className="grid gap-10 md:grid-cols-2 md:gap-8">
          {places.map((place, index) => (
            <motion.div
              key={place.venue}
              initial={{ opacity: 0, y: 44, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.2, delay: index * 0.15, ease: EASE }}
              className="glass-panel flex flex-col rounded-3xl px-8 py-10 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)] sm:px-12 sm:py-12"
            >
              <p className="eyebrow text-gold-light">{place.eyebrow}</p>

              <h2 className="type-display-xl mt-4 font-medium text-blush">
                <span className="font-script text-[0.7em] leading-none">{place.venue}</span>
              </h2>

              <p className="mx-auto mt-6 max-w-sm font-body text-sm font-light leading-relaxed text-blush/75">
                {place.address}
              </p>

              <span className="mt-7 inline-block self-center rounded-full border border-gold/50 px-6 py-2 font-display text-base italic text-gold-light">
                {place.time}
              </span>

              <div className="mt-10">
                <GlowButton variant="outline-light" href={place.mapsUrl} ariaLabel={`Abrir ${place.venue} en Google Maps`}>
                  Ver ubicación
                </GlowButton>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}