import { config } from '../config'

type PhoneResult = { ok: true; phone: string } | { ok: false; error: string }

/**
 * Normaliza un teléfono al formato internacional que WhatsApp espera en el JID:
 * quita espacios/guiones/paréntesis y el "+", y para México agrega el "1" móvil
 * tras el código de país (10 dígitos → 521XXXXXXXXXX, 13 dígitos totales).
 */
export function normalizePhone(raw: string): PhoneResult {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, error: 'El número de celular debe tener entre 10 y 15 dígitos' }
  }

  if (digits.length === 10) {
    return { ok: true, phone: `${config.defaultCountryCode}${config.mobilePrefix}${digits}` }
  }

  if (
    config.mobilePrefix &&
    digits.length === 12 &&
    digits.startsWith(config.defaultCountryCode)
  ) {
    return { ok: true, phone: `${config.defaultCountryCode}${config.mobilePrefix}${digits.slice(2)}` }
  }

  if (config.mobilePrefix && digits.length === 11 && digits.startsWith(config.mobilePrefix)) {
    return { ok: true, phone: `${config.defaultCountryCode}${digits}` }
  }

  return { ok: true, phone: digits }
}

/**
 * Repara números ya normalizados/guardados antes de la corrección del "1" móvil
 * (ej. MongoDB con "522221234567" de 12 dígitos → "5212221234567").
 * Si el número no coincide con el patrón conocido, lo deja igual.
 */
export function repairPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (
    config.mobilePrefix &&
    digits.length === 12 &&
    digits.startsWith(config.defaultCountryCode)
  ) {
    return `${config.defaultCountryCode}${config.mobilePrefix}${digits.slice(2)}`
  }
  return digits
}

/**
 * Variantes de un número a probar contra WhatsApp: con y sin el dígito móvil
 * (México acepta `521XXXXXXXXXX` y `52XXXXXXXXXX`). Ayuda a detectar bajo qué
 * formato está registrado el número realmente.
 */
export function phoneVariants(raw: string): string[] {
  const digits = repairPhone(raw)
  const variants = [digits]
  const cc = config.defaultCountryCode
  const mp = config.mobilePrefix
  if (mp && cc) {
    if (digits.length === cc.length + mp.length + 10 && digits.startsWith(cc + mp)) {
      variants.push(cc + digits.slice(cc.length + mp.length))
    } else if (digits.length === cc.length + 10 && digits.startsWith(cc)) {
      variants.push(cc + mp + digits.slice(cc.length))
    }
  }
  return [...new Set(variants)]
}