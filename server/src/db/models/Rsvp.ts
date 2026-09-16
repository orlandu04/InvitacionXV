import { model, Schema } from 'mongoose'

export interface RsvpDoc {
  nombre: string
  telefono: string
  mensaje: string
  enviado: boolean
  estado?: 'pendiente' | 'enviado' | 'entregado' | 'error'
  createdAt: Date
}

const rsvpSchema = new Schema<RsvpDoc>(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, required: true, trim: true },
    mensaje: { type: String, default: '' },
    enviado: { type: Boolean, default: false },
    estado: {
      type: String,
      enum: ['pendiente', 'enviado', 'entregado', 'error'],
      default: 'pendiente',
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

export const Rsvp = model<RsvpDoc>('Rsvp', rsvpSchema)