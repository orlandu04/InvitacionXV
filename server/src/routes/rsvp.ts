import { Router } from 'express'
import { config } from '../config'
import { Rsvp } from '../db/models/Rsvp'
import { getRsvpTemplate, renderTemplate } from '../settings'
import { normalizePhone } from '../utils/phone'
import { sendMessage } from '../whatsapp/client'

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

  const doc = await Rsvp.create({ nombre: nombre.trim(), telefono: parsed.phone })

  const template = await getRsvpTemplate()
  const mensaje = renderTemplate(template, {
    nombre: doc.nombre,
    quinceanera: config.quinceanera,
    fecha: config.eventDate,
  })

  try {
    await sendMessage(parsed.phone, mensaje)
    await doc.updateOne({ $set: { mensaje, enviado: true } })
    console.log(`[rsvp] ${doc.nombre} (${parsed.phone}) confirmó · mensaje enviado`)
    res.status(201).json({ ok: true, id: doc.id, mensaje })
  } catch {
    // WhatsApp temporalmente no disponible: igual se registra la confirmación.
    await doc.updateOne({ $set: { mensaje } })
    console.warn(`[rsvp] ${doc.nombre} (${parsed.phone}) confirmó · WhatsApp pendiente`)
    res.status(201).json({ ok: true, id: doc.id, mensaje, whatsapp: 'pendiente' })
  }
})