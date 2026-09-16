import { Router } from 'express'
import { config } from '../config'
import { Rsvp } from '../db/models/Rsvp'
import { requireAdmin, ADMIN_COOKIE } from '../middleware/auth'
import { getRsvpTemplate, renderTemplate, setRsvpTemplate, MESSAGE_PLACEHOLDERS } from '../settings'
import { normalizePhone } from '../utils/phone'
import { getStatus, logoutWhatsApp, sendMessage } from '../whatsapp/client'
import { onEvent } from '../whatsapp/events'

export const adminRouter = Router()

async function buildMessage(nombre: string): Promise<string> {
  const template = await getRsvpTemplate()
  return renderTemplate(template, {
    nombre,
    quinceanera: config.quinceanera,
    fecha: config.eventDate,
  })
}

/* ── Autenticación del panel ─────────────────────────────── */

adminRouter.post('/login', (req, res) => {
  const { password } = (req.body ?? {}) as { password?: unknown }
  if (password !== config.adminPassword) {
    res.status(401).json({ error: 'Contraseña incorrecta' })
    return
  }
  res.cookie(ADMIN_COOKIE, config.adminPassword, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  })
  res.json({ ok: true })
})

adminRouter.post('/logout', (_req, res) => {
  res.clearCookie(ADMIN_COOKIE)
  res.json({ ok: true })
})

/* ── Estado de WhatsApp (con SSE para el QR en vivo) ─────── */

adminRouter.get('/events', requireAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.flushHeaders()
  const send = (data: unknown): void => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
  send(getStatus())
  const off = onEvent(send)
  req.on('close', () => {
    off()
    res.end()
  })
})

adminRouter.get('/status', requireAdmin, (_req, res) => {
  res.json(getStatus())
})

adminRouter.post('/whatsapp/logout', requireAdmin, async (_req, res) => {
  try {
    await logoutWhatsApp()
    res.json({ ok: true })
  } catch (error) {
    res.status(409).json({ error: error instanceof Error ? error.message : 'No conectado' })
  }
})

/* ── Prueba de envío WhatsApp ─────────────────────────────── */

adminRouter.post('/whatsapp/test', requireAdmin, async (req, res) => {
  const { telefono } = (req.body ?? {}) as { telefono?: unknown }
  if (typeof telefono !== 'string' || !telefono.trim()) {
    res.status(400).json({ error: 'Escribe un número de celular' })
    return
  }
  const parsed = normalizePhone(telefono)
  if (!parsed.ok) {
    res.status(400).json({ error: parsed.error })
    return
  }
  const mensaje = await buildMessage('Mensaje de prueba')
  try {
    await sendMessage(parsed.phone, mensaje)
    res.json({ ok: true, jid: `${parsed.phone}@s.whatsapp.net`, mensaje: `Enviado a ${parsed.phone}@s.whatsapp.net` })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'WhatsApp no conectado' })
  }
})

/* ── Mensaje personalizado ───────────────────────────────── */

adminRouter.get('/message', requireAdmin, async (_req, res) => {
  res.json({ template: await getRsvpTemplate(), placeholders: MESSAGE_PLACEHOLDERS })
})

adminRouter.post('/message', requireAdmin, async (req, res) => {
  const { template } = (req.body ?? {}) as { template?: unknown }
  if (typeof template !== 'string' || !template.trim()) {
    res.status(400).json({ error: 'El mensaje no puede estar vacío' })
    return
  }
  await setRsvpTemplate(template)
  res.json({ ok: true, template: await getRsvpTemplate() })
})

/* ── Confirmaciones (RSVPs) ───────────────────────────────── */

adminRouter.get('/rsvps', requireAdmin, async (_req, res) => {
  const docs = await Rsvp.find().sort({ createdAt: -1 }).lean()
  res.json({
    rows: docs.map((doc) => ({
      id: String(doc._id),
      nombre: doc.nombre,
      telefono: doc.telefono,
      mensaje: doc.mensaje,
      enviado: doc.enviado,
      estado: doc.estado,
      fecha: doc.createdAt,
    })),
  })
})

adminRouter.post('/rsvps/:id/resend', requireAdmin, async (req, res) => {
  const doc = await Rsvp.findById(req.params.id)
  if (!doc) {
    res.status(404).json({ error: 'No encontrado' })
    return
  }
  try {
    const mensaje = await buildMessage(doc.nombre)
    await sendMessage(doc.telefono, mensaje, { rsvpId: doc.id })
    await doc.updateOne({ $set: { mensaje, enviado: true, estado: 'enviado' } })
    res.json({ ok: true, mensaje })
  } catch {
    res.status(502).json({ error: 'WhatsApp no conectado, intenta más tarde' })
  }
})

adminRouter.post('/rsvps/broadcast', requireAdmin, async (_req, res) => {
  const docs = await Rsvp.find().lean()
  const rows = { enviados: 0, pendientes: 0, errores: [] as string[] }
  for (const doc of docs) {
    try {
      const mensaje = await buildMessage(doc.nombre)
      await sendMessage(doc.telefono, mensaje, { rsvpId: String(doc._id) })
      await Rsvp.updateOne({ _id: doc._id }, { $set: { mensaje, enviado: true, estado: 'enviado' } })
      rows.enviados += 1
    } catch {
      rows.pendientes += 1
      rows.errores.push(doc.nombre)
    }
  }
  res.json({ ok: true, ...rows })
})

adminRouter.delete('/rsvps/:id', requireAdmin, async (req, res) => {
  await Rsvp.deleteOne({ _id: req.params.id })
  res.json({ ok: true })
})