import { model, Schema } from 'mongoose'

export type RsvpStatus = 'confirmado' | 'pendiente' | 'enviado' | 'entregado' | 'fallido'

export interface RsvpDoc {
  nombre: string
  telefono: string
  personas: number
  mensaje: string
  enviado: boolean
  status: RsvpStatus
  whatsappCheckedAt?: Date
  whatsappJid?: string
  lastError?: string
  retryCount: number
  // ✅ FIX #4 — tracking de entrega persistente (sobrevive reinicios)
  waMessageId?: string | null
  waPendingAt?: Date | null
  createdAt: Date
}

const rsvpSchema = new Schema<RsvpDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    personas: { type: Number, default: 1, min: 1, max: 50 },
    mensaje: { type: String, default: '' },
    enviado: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['confirmado', 'pendiente', 'enviado', 'entregado', 'fallido'],
      default: 'confirmado',
    },
    whatsappCheckedAt: { type: Date },
    whatsappJid: { type: String },
    lastError: { type: String },
    retryCount: { type: Number, default: 0 },
    // ✅ FIX #4 — id del mensaje en WhatsApp + timestamp del PENDING
    waMessageId: { type: String, default: null },
    waPendingAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// ✅ Índice para el barrido del watchdog (waPendingAt + status)
rsvpSchema.index({ status: 1, waPendingAt: 1 })

// ✅ Índice para el reaper (status + retryCount)
rsvpSchema.index({ status: 1, retryCount: 1 })

// ✅ Índice para lookup por messageId (messages.update)
rsvpSchema.index({ waMessageId: 1 }, { sparse: true })

export const Rsvp = model<RsvpDoc>('Rsvp', rsvpSchema)