import { apiUrl } from '../config/api'

export interface RsvpResult {
  ok: boolean
  id?: string
  mensaje?: string
  whatsapp?: 'pendiente'
}

/** Envía la confirmación (nombre + celular) al backend. */
export async function submitRsvp(nombre: string, telefono: string): Promise<RsvpResult> {
  const res = await fetch(`${apiUrl}/api/rsvps`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nombre, telefono }),
  })

  const data = (await res.json().catch(() => null)) as (RsvpResult & { error?: string }) | null

  if (!res.ok || !data?.ok) {
    throw new Error(data?.error ?? 'No pudimos registrar tu confirmación.')
  }
  return data
}