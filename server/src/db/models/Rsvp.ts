import { model, Schema } from 'mongoose'

export interface RsvpDoc {
  nombre: string
  telefono: string
  mensaje: string
  enviado: boolean
  createdAt: Date
}

const rsvpSchema = new Schema<RsvpDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    mensaje: { type: String, default: '' },
    enviado: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Rsvp = model<RsvpDoc>('Rsvp', rsvpSchema)