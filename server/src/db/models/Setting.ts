import { model, Schema } from 'mongoose'

export interface SettingDoc {
  key: string
  value: unknown
}

const settingSchema = new Schema<SettingDoc>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
})

export const Setting = model<SettingDoc>('Setting', settingSchema)