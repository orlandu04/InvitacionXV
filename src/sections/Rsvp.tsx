import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, MessageCircleHeart, Phone, User } from 'lucide-react'
import { useRef, useState } from 'react'

import { Sparkles } from '../components/effects/Sparkles'
import { invitation } from '../config/invitation'
import { buildWhatsAppUrl, social } from '../config/social'
import { submitRsvp } from '../lib/rsvp'

const EASE = [0.22, 1, 0.36, 1] as const

/** Enlace de respaldo si el backend no está disponible */
const RSVP_URL = buildWhatsAppUrl(
  social.rsvpMessage(invitation.name, '28 de noviembre de 2026'),
)

const FIELD_CLASS =
  'w-full rounded-full border border-gold/35 bg-white/70 py-3.5 pl-12 pr-5 font-body text-sm text-ink shadow-sm outline-none transition placeholder:text-ink/40 focus:border-gold focus:ring-2 focus:ring-gold/30'

const LABEL_CLASS =
  'mb-2 block font-body text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-gold-deep'

type Estado = 'idle' | 'enviando' | 'ok' | 'error'

/** Confirmación de asistencia — nombre y celular, con envío de WhatsApp vía backend. */
export function Rsvp(): React.JSX.Element {
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [feedback, setFeedback] = useState('')
  const submittedRef = useRef(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (submittedRef.current) return
    if (!nombre.trim() || !telefono.trim()) {
      setEstado('error')
      setFeedback('Completa tu nombre y tu número de celular para confirmar.')
      return
    }
    submittedRef.current = true
    setEstado('enviando')
    setFeedback('')
    try {
      const res = await submitRsvp(nombre.trim(), telefono.trim())
      setEstado('ok')
      setFeedback(
        res.whatsapp === 'pendiente'
          ? `¡Gracias, ${nombre.trim().split(' ')[0]}! Registramos tu confirmación; te la confirmaremos por WhatsApp en breve.`
          : `¡Gracias, ${nombre.trim().split(' ')[0]}! Recibimos tu confirmación y te enviamos un WhatsApp con los detalles.`,
      )
    } catch (error) {
      submittedRef.current = false
      setEstado('error')
      setFeedback(error instanceof Error ? error.message : 'No pudimos registrar tu confirmación.')
    }
  }

  return (
    <section
      id="rsvp"
      aria-label="Confirmar asistencia"
      className="grain relative overflow-hidden bg-gradient-to-b from-blush via-rose-pastel/45 to-champagne py-24 text-center sm:py-36"
    >
      <Sparkles density={0.7} />

      {/* halo central */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.16), transparent 65%)' }}
      />

      <div className="relative z-10 mx-auto max-w-xl px-6">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1.1, ease: EASE }}
          className="type-display-xl font-medium text-ink"
        >
          Será un{' '}
          <span className="font-script text-gilded text-[1.35em] font-normal">honor</span>
          <br />
          compartir esta noche contigo.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2, ease: EASE }}
          className="mt-12"
        >
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col gap-6 rounded-[28px] border border-gold/25 bg-white/45 p-6 shadow-[0_18px_50px_rgba(190,24,93,0.10)] backdrop-blur-sm sm:p-8"
          >
            <div className="text-left">
              <label htmlFor="rsvp-nombre" className={LABEL_CLASS}>
                Tu nombre
              </label>
              <div className="relative">
                <User
                  size={16}
                  strokeWidth={1.6}
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold-deep/70"
                />
                <input
                  id="rsvp-nombre"
                  type="text"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="Ej. Ana María"
                  maxLength={80}
                  autoComplete="name"
                  className={FIELD_CLASS}
                />
              </div>
            </div>

            <div className="text-left">
              <label htmlFor="rsvp-telefono" className={LABEL_CLASS}>
                Número de celular
              </label>
              <div className="relative">
                <Phone
                  size={16}
                  strokeWidth={1.6}
                  aria-hidden
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gold-deep/70"
                />
                <input
                  id="rsvp-telefono"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  placeholder="Ej. 222 123 4567"
                  minLength={10}
                  maxLength={15}
                  autoComplete="tel"
                  className={FIELD_CLASS}
                />
              </div>
              <p className="mt-2 text-left font-body text-xs text-ink/45">
                Te enviaremos la confirmación por WhatsApp.
              </p>
            </div>

            <button
              type="submit"
              disabled={estado === 'enviando' || estado === 'ok'}
              className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-full bg-gradient-to-r from-champagne via-gold to-champagne px-9 py-4 font-body text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-ink shadow-[0_0_28px_rgba(212,175,55,0.38)] transition-shadow duration-500 select-none hover:shadow-[0_0_44px_rgba(212,175,55,0.6)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {estado === 'enviando' ? (
                <>
                  <Loader2 size={18} strokeWidth={1.6} className="animate-spin" aria-hidden />
                  Enviando…
                </>
              ) : (
                <>
                  <MessageCircleHeart size={18} strokeWidth={1.6} aria-hidden />
                  Confirmar asistencia
                </>
              )}
            </button>

            {estado === 'ok' && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-2 font-display text-sm text-rose-deep"
                role="status"
              >
                <CheckCircle2 size={17} strokeWidth={1.6} aria-hidden />
                {feedback}
              </motion.p>
            )}

            {estado === 'error' && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-body text-sm text-rose-deep"
                role="alert"
              >
                {feedback}{' '}
                <a
                  href={RSVP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-gold/60 underline-offset-4 hover:text-gold-deep"
                >
                  O escríbenos por WhatsApp →
                </a>
              </motion.p>
            )}
          </form>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.4 }}
          className="mt-8 font-display text-sm italic text-ink/55"
        >
          {invitation.rsvp.note}
        </motion.p>
      </div>
    </section>
  )
}