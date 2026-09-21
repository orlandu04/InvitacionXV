import { Router } from 'express'
import { Rsvp } from '../db/models/Rsvp'
import { buildRsvpMessage } from '../settings'
import { normalizePhone, phoneVariants } from '../utils/phone'
import { checkWhatsAppNumbers, isSocketOpen, sendMessage } from '../whatsapp/client'
import { enqueueRsvpSend } from '../whatsapp/queue'

export const rsvpRouter = Router()

interface RsvpBody {
  nombre?: unknown
  telefono?: unknown
  personas?: unknown
}

const SEND_TIMEOUT_MS = 5000

/** Promise.race manual para no dejar la petición colgada si el envío se atora. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      },
    )
  })
}

rsvpRouter.post('/', async (req, res) => {
  const { nombre, telefono, personas } = (req.body ?? {}) as RsvpBody

  if (typeof nombre !== 'string' || !nombre.trim()) {
    res.status(400).json({ error: 'El nombre es obligatorio' })
    return
  }
  if (typeof telefono !== 'string' || !telefono.trim()) {
    res.status(400).json({ error: 'El número de celular es obligatorio' })
    return
  }
  const parsed = normalizePhone(telefono)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  const cantidad = typeof personas === 'number' && Number.isFinite(personas) ? personas : Number.parseInt(String(personas), 10)
  if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50) {
    res.status(400).json({ error: 'Indica un número de personas válido (1 a 50)' })
    return
  }

  // 1) Persistir SIEMPRE primero: nunca perder una confirmación.
  const doc = await Rsvp.create({ nombre: nombre.trim(), telefono: parsed.phone, personas: cantidad })

  // 2) ¿Socket de Baileys realmente abierto?
  if (!isSocketOpen()) {
    await doc.updateOne({
      $set: { status: 'pendiente', whatsappCheckedAt: new Date(), lastError: 'socket_down' },
    })
    console.warn(`[rsvp] ${doc.nombre} confirmó · socket de WhatsApp no disponible`)
    res.status(201).json({ ok: true, id: doc.id, whatsapp: 'pendiente' })
    return
  }

  // 3) Resolver el JID REAL con una sola llamada a onWhatsApp.
  const mensaje = await buildRsvpMessage(doc.nombre)
  let jid: string | null = null
  try {
    const found = await checkWhatsAppNumbers(phoneVariants(parsed.phone))
    jid = found[0]?.jid ?? null
  } catch (error) {
    // 3a) La verificación falló (red/socket): NO se envía sin JID validado.
    const errMsg = error instanceof Error ? error.message : 'check_failed'
    await doc.updateOne({
      $set: {
        status: 'pendiente',
        whatsappCheckedAt: new Date(),
        lastError: `check_failed: ${errMsg}`,
      },
    })
    console.warn(`[rsvp] ${doc.nombre} · verificación falló (${errMsg}) → pendiente`)
    res.status(201).json({ ok: true, id: doc.id, whatsapp: 'pendiente' })
    return
  }

  if (!jid) {
    // 3b) WhatsApp respondió: el número NO existe.
    await doc.updateOne({
      $set: {
        status: 'pendiente',
        whatsappCheckedAt: new Date(),
        lastError: 'not_on_whatsapp',
      },
    })
    console.warn(`[rsvp] ${doc.nombre} (${parsed.phone}) no existe en WhatsApp`)
    res.status(201).json({ ok: true, id: doc.id, whatsapp: 'pendiente' })
    return
  }

  await doc.updateOne({ $set: { whatsappJid: jid, whatsappCheckedAt: new Date() } })

  // 4) Envío inline con timeout. sendMessage persiste status/waPendingAt en DB.
  try {
    await withTimeout(sendMessage(jid, mensaje, { rsvpId: doc.id }), SEND_TIMEOUT_MS)
    await doc.updateOne({ $set: { mensaje } })
    console.log(`[rsvp] ${doc.nombre} (${parsed.phone}) confirmó → ${jid} · enviado`)
    res.status(201).json({ ok: true, id: doc.id, whatsapp: 'enviado' })
  } catch (error) {
    // Timeout/error: no bloquear al invitado. Queda pendiente + cola de reintento.
    const errMsg = error instanceof Error ? error.message : 'send_failed'
    await doc.updateOne({
      $set: { status: 'pendiente', lastError: `send_failed: ${errMsg}` },
    })
    await enqueueRsvpSend({ rsvpId: doc.id, jid, nombre: doc.nombre })
    console.warn(
      `[rsvp] ${doc.nombre} → ${jid} · envío falló (${errMsg}) · encolado para reintento`,
    )
    res.status(201).json({ ok: true, id: doc.id, whatsapp: 'pendiente' })
  }
})