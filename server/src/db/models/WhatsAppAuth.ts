import { model, Schema } from 'mongoose'

export interface WhatsAppAuthDoc {
  key: string
  value: unknown
}

const whatsAppAuthSchema = new Schema<WhatsAppAuthDoc>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
})

export const WhatsAppAuth = model<WhatsAppAuthDoc>('WhatsAppAuth', whatsAppAuthSchema)