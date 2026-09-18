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

/**
 * Variantes alternativas del mensaje. Solo se usan cuando el admin NO personalizó
 * la plantilla (sigue siendo la de fábrica) para variar los envíos y reducir
 * el riesgo de ban por mensajes idénticos.
 */
export const VARIANT_TEMPLATES = [
  '¡Hola {nombre}! 🎉 Confirmamos tu lugar en los XV años de {quinceanera} el {fecha}. ¡Nos vemos ahí! ✨',
  '{nombre}, tu confirmación quedó registrada ✅ Te esperamos el {fecha} para celebrar los XV años de {quinceanera}.',
  'Hey {nombre}, ¡nos vemos pronto! Tu lugar está apartado para el {fecha} en los XV años de {quinceanera}. 💛',
]

export async function isDefaultTemplate(): Promise<boolean> {
  return (await getRsvpTemplate()) === config.defaultMessage
}

export function pickVariantTemplate(): string {
  return VARIANT_TEMPLATES[Math.floor(Math.random() * VARIANT_TEMPLATES.length)]!
}

/**
 * Opción B: si el admin NO personalizó la plantilla (sigue siendo la de fábrica)
 * se rota entre las variantes para evitar mensajes idénticos (antispam); en
 * cuanto el admin guarda su propio texto, se usa tal cual sin variar.
 */
export async function buildRsvpMessage(nombre: string): Promise<string> {
  const isDefault = await isDefaultTemplate()
  const template = isDefault ? pickVariantTemplate() : await getRsvpTemplate()
  return renderTemplate(template, {
    nombre,
    quinceanera: config.quinceanera,
    fecha: config.eventDate,
  })
}