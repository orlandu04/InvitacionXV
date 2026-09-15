import { config } from '../config'

type PhoneResult = { ok: true; phone: string } | { ok: false; error: string }

/** Normaliza un teléfono: quita espacios, guiones, paréntesis y el "+". */
export function normalizePhone(raw: string): PhoneResult {
  const digits = raw.replace(/\D/g, '')
  if (digits.length < 10 || digits.length > 15) {
    return { ok: false, error: 'El número de celular debe tener entre 10 y 15 dígitos' }
  }
  const phone = digits.length === 10 ? `${config.defaultCountryCode}${digits}` : digits
  return { ok: true, phone }
}