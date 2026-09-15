import { motion } from 'framer-motion'

import { FloralDecoration } from '../components/effects/FloralDecoration'
import { invitation } from '../config/invitation'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Código de vestimenta — composición tipográfica central
 * con la paleta sugerida como detalle editorial.
 */
export function DressCode(): React.JSX.Element {
  return (
    <section
      id="dresscode"
      aria-label="Código de vestimenta"
      className="grain relative overflow-hidden bg-gradient-to-b from-rose-pastel/40 via-white to-blush py-24 text-center sm:py-32"
    >
      <FloralDecoration variant="side" from="right" flipX width={140} drift={26} className="-right-6 top-1/2 -translate-y-1/2 opacity-60" />
      <FloralDecoration variant="sprig" from="left" width={110} drift={30} className="-left-4 top-16 opacity-50" />

      <div className="relative z-10 mx-auto max-w-md px-6">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="eyebrow text-gold-deep"
        >
          Código de vestimenta
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 34 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.1, ease: EASE }}
          className="font-script mt-4 text-5xl text-rose-deep sm:text-6xl"
        >
          {invitation.dressCode.heading}
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 26, letterSpacing: '0.15em' }}
          whileInView={{ opacity: 1, y: 0, letterSpacing: '0.45em' }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 1.3, ease: EASE }}
          className="type-display-xl mt-2 font-medium uppercase text-ink"
        >
          {invitation.dressCode.value}
        </motion.h2>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.25 }}
        >
          <p className="mt-5 font-display text-base italic text-ink/60">
            {invitation.dressCode.note}
          </p>

          {/* paleta sugerida */}
          <ul className="mt-8 flex items-center justify-center gap-3" aria-label="Paleta de colores sugerida">
            {invitation.dressCode.suggestedColors.map((color) => (
              <li
                key={color}
                title={color}
                className="h-7 w-7 rounded-full border border-gold/50 shadow-inner transition-transform duration-300 hover:scale-110"
                style={{ backgroundColor: color }}
              />
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
