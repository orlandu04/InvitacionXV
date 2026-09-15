import { config } from './config'
import { Setting } from './db/models/Setting'

const MESSAGE_KEY = 'rsvp.message'

export const MESSAGE_PLACEHOLDERS = ['{nombre}', '{quinceanera}', '{fecha}']

export async function getRsvpTemplate(): Promise<string> {
  const doc = await Setting.findOne({ key: MESSAGE_KEY }).lean()
  return typeof doc?.value === 'string' && doc.value.trim()
    ? doc.value
    : config.defaultMessage
}

export async function setRsvpTemplate(template: string): Promise<void> {
  await Setting.updateOne(
    { key: MESSAGE_KEY },
    { $set: { value: template.trim() } },
    { upsert: true },
  )
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}