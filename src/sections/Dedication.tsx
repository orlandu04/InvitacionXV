import { motion } from 'framer-motion'

import { FloralDecoration } from '../components/effects/FloralDecoration'
import { invitation } from '../config/invitation'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Dedicatoria — composición tipográfica central que rellena el espacio
 * tras la cortina: "Mis XV años" y una frase de bienvenida.
 */
export function Dedication(): React.JSX.Element {
  return (
    <section
      id="dedication"
      aria-label="Mis XV años"
      className="grain relative overflow-hidden bg-gradient-to-b from-white via-blush to-champagne py-20 text-center sm:py-28"
    >
      <FloralDecoration variant="corner" from="left" width={160} drift={22} className="-left-8 top-10 opacity-50" />
      <FloralDecoration variant="sprig" from="right" flipX width={120} drift={30} className="-right-4 bottom-12 opacity-45" />

      {/* aura dorada */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.14), transparent 65%)' }}
      />

      <div className="relative z-10 mx-auto max-w-2xl px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="eyebrow text-gold-deep"
        >
          {invitation.dedication.eyebrow}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 34, filter: 'blur(6px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.1, ease: EASE }}
          className="font-script mt-4 text-5xl text-rose-deep sm:text-6xl"
        >
          {invitation.dedication.heading}
        </motion.p>

        <motion.div
          aria-hidden="true"
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          className="mt-7 flex items-center justify-center gap-4"
        >
          <span className="gold-hairline w-16 sm:w-24" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold" />
          <span className="gold-hairline w-16 sm:w-24" />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1, delay: 0.25, ease: EASE }}
          className="mt-8 font-display text-lg italic leading-relaxed text-ink/65 sm:text-xl"
        >
          {invitation.dedication.phrase}
        </motion.p>
      </div>
    </section>
  )
}