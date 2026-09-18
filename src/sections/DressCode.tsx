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
          {/* aviso destacado */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
            className="mx-auto mt-8 max-w-sm rounded-2xl border border-rose-intense/40 bg-gradient-to-b from-white/70 to-rose-pastel/30 px-6 py-5 shadow-[0_10px_30px_rgba(190,24,93,0.14)]"
            role="note"
          >
            <p className="font-body text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-gold-deep">
              Por favor
            </p>
            <p className="mt-1 font-script text-4xl leading-tight text-rose-deep sm:text-5xl">
              <span className="underline decoration-rose-intense/50 decoration-2 underline-offset-8">
                Evita el color rosa
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
