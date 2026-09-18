import { model, Schema } from 'mongoose'

export type RsvpStatus = 'confirmado' | 'pendiente' | 'enviado' | 'entregado' | 'fallido'

export interface RsvpDoc {
  nombre: string
  telefono: string
  mensaje: string
  enviado: boolean
  status: RsvpStatus
  whatsappCheckedAt?: Date
  whatsappJid?: string
  lastError?: string
  retryCount: number
  createdAt: Date
}

const rsvpSchema = new Schema<RsvpDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Rsvp = model<RsvpDoc>('Rsvp', rsvpSchema)