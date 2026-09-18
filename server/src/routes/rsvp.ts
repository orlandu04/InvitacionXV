import { Router } from 'express'
import { Rsvp } from '../db/models/Rsvp'
import { buildRsvpMessage } from '../settings'
import { likelyWhatsAppJid, normalizePhone, phoneVariants } from '../utils/phone'
import { checkWhatsAppNumbers, isSocketOpen } from '../whatsapp/client'
import { enqueueRsvpSend } from '../whatsapp/queue'

export const rsvpRouter = Router()

interface RsvpBody {
  nombre?: unknown
  telefono?: unknown
}

rsvpRouter.post('/', async (req, res) => {
  const { nombre, telefono } = (req.body ?? {}) as RsvpBody

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

  // 1) Persistir SIEMPRE primero: nunca perder una confirmación.
  const doc = await Rsvp.create({ nombre: nombre.trim(), telefono: parsed.phone })

  // 2) ¿Socket de Baileys realmente abierto?
  if (!isSocketOpen()) {
    await doc.updateOne({
      $set: { status: 'pendiente', whatsappCheckedAt: new Date(), lastError: 'socket_down' },
    })
    console.warn(`[rsvp] ${doc.nombre} confirmó · socket de WhatsApp no disponible`)
    res.status(201).json({ ok: true, id: doc.id, whatsapp: 'pendiente' })
    return
  }

  // 3) Resolver el JID real con una sola llamada a onWhatsApp.
  const variants = phoneVariants(parsed.phone)
  let jid: string | null = null
  let checkError: string | null = null
  try {
    const found = await checkWhatsAppNumbers(variants)
    jid = found[0]?.jid ?? null
  } catch (error) {
    checkError = error instanceof Error ? error.message : 'check_failed'
  }

  const mensaje = await buildRsvpMessage(doc.nombre)

  if (!jid) {
    if (checkError) {
      // La verificación falló (red/socket): no bloquees al invitado. Envía
      // best-effort al JID más probable y deja el reintento a la cola.
      const likely = likelyWhatsAppJid(parsed.phone)
      await doc.updateOne({
        $set: {
          status: 'enviado',
          enviado: true,
          mensaje,
          whatsappJid: likely,
          whatsappCheckedAt: new Date(),
          lastError: `check_failed: ${checkError}`,
        },
      })
      await enqueueRsvpSend({ rsvpId: doc.id, jid: likely, nombre: doc.nombre })
      console.warn(
        `[rsvp] ${doc.nombre} · verificación falló (${checkError}) · best-effort a ${likely}`,
      )
      res.status(201).json({ ok: true, id: doc.id, whatsapp: 'enviado' })
    } else {
      // WhatsApp respondió: el número NO existe.
      await doc.updateOne({
        $set: {
          status: 'pendiente',
          whatsappCheckedAt: new Date(),
          lastError: 'not_on_whatsapp',
        },
      })
      console.warn(`[rsvp] ${doc.nombre} (${parsed.phone}) no existe en WhatsApp`)
      res.status(201).json({ ok: true, id: doc.id, whatsapp: 'pendiente' })
    }
    return
  }

  // 4) Existe: registrar JID y encolar el envío (3-10 s, con reintentos).
  await doc.updateOne({
    $set: {
      status: 'enviado',
      enviado: true,
      mensaje,
      whatsappJid: jid,
      whatsappCheckedAt: new Date(),
      lastError: null,
    },
  })
  await enqueueRsvpSend({ rsvpId: doc.id, jid, nombre: doc.nombre })
  console.log(`[rsvp] ${doc.nombre} (${parsed.phone}) confirmó → JID ${jid} · enviando…`)
  res.status(201).json({ ok: true, id: doc.id, whatsapp: 'enviado' })
})