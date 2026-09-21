import { Router } from 'express'
import { config } from '../config'
import { Rsvp } from '../db/models/Rsvp'
import { requireAdmin, ADMIN_COOKIE } from '../middleware/auth'
import { buildRsvpMessage, getRsvpTemplate, setRsvpTemplate, MESSAGE_PLACEHOLDERS } from '../settings'
import { normalizePhone, phoneVariants } from '../utils/phone'
import { checkWhatsAppNumbers, getStatus, isSocketOpen, logoutWhatsApp, sendMessage } from '../whatsapp/client'
import { onEvent } from '../whatsapp/events'

export const adminRouter = Router()

const BROADCAST_BATCH = 10
const BROADCAST_BATCH_DELAY_MS = 2000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
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

/* ── Verificación de número (¿existe en WhatsApp?) ────────── */

adminRouter.post('/whatsapp/check', requireAdmin, async (req, res) => {
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
  const variants = phoneVariants(parsed.phone)
  try {
    const found = await checkWhatsAppNumbers(variants)
    const jids = found.map((entry) => entry.jid)
    res.json({
      ok: true,
      phone: parsed.phone,
      variants,
      encontrado: found.length > 0,
      jids,
    })
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : 'WhatsApp no conectado' })
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
  const mensaje = await buildRsvpMessage('Mensaje de prueba')
  if (!isSocketOpen()) {
    res.status(502).json({ error: 'El socket de WhatsApp no está abierto (¿cerraste sesión o expiró el QR?).' })
    return
  }
  let ganadorJid: string | null = null
  try {
    const found = await checkWhatsAppNumbers(phoneVariants(parsed.phone))
    ganadorJid = found[0]?.jid ?? null
  } catch (error) {
    // onWhatsApp() falló (socket/red) → NO enviar, nada de best-effort.
    res.status(502).json({
      error: error instanceof Error ? error.message : 'No se pudo verificar el número, intenta más tarde',
    })
    return
  }
  if (!ganadorJid) {
    res.status(422).json({
      error: `El número ${parsed.phone} no existe en WhatsApp (verificado). Revisa que el número sea correcto y que tenga WhatsApp activo.`,
    })
    return
  }
  try {
    const { messageId } = await sendMessage(ganadorJid, mensaje)
    res.json({
      ok: true,
      jid: ganadorJid,
      messageId,
      mensaje: `Verificado en WhatsApp como ${ganadorJid}. Mensaje salió a ese JID. "Enviado" solo significa que se escribió; revisa si llega (antispam/sin contacto guardado puede ocultarlo).`,
    })
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
      personas: doc.personas ?? 1,
      mensaje: doc.mensaje,
      enviado: doc.enviado,
      status: doc.status,
      whatsappJid: doc.whatsappJid,
      lastError: doc.lastError,
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
  if (!isSocketOpen()) {
    res.status(502).json({ error: 'El socket de WhatsApp no está abierto.' })
    return
  }
  const mensaje = await buildRsvpMessage(doc.nombre)
  let jid: string | null = null
  try {
    const found = await checkWhatsAppNumbers(phoneVariants(doc.telefono))
    jid = found[0]?.jid ?? null
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'No se pudo verificar el número, intenta más tarde',
    })
    return
  }
  if (!jid) {
    res.status(422).json({
      error: `El número ${doc.telefono} no existe en WhatsApp (verificado). Revisa que tenga WhatsApp activo.`,
    })
    return
  }
  try {
    await sendMessage(jid, mensaje, { rsvpId: doc.id })
    await doc.updateOne({
      $set: {
        mensaje,
        enviado: true,
        status: 'enviado',
        whatsappJid: jid,
        whatsappCheckedAt: new Date(),
        lastError: null,
      },
    })
    res.json({ ok: true, mensaje, jid })
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'WhatsApp no conectado, intenta más tarde',
    })
  }
})

adminRouter.post('/rsvps/broadcast', requireAdmin, async (_req, res) => {
  if (!isSocketOpen()) {
    res.status(502).json({ error: 'El socket de WhatsApp no está abierto.' })
    return
  }
  const docs = await Rsvp.find().lean()
  const rows = { enviados: 0, pendientes: 0, errores: [] as string[] }

  // Verifica y envía en lotes para no disparar rate-limit de onWhatsApp.
  for (let i = 0; i < docs.length; i += BROADCAST_BATCH) {
    const lote = docs.slice(i, i + BROADCAST_BATCH)
    await Promise.all(
      lote.map(async (doc) => {
        try {
          const mensaje = await buildRsvpMessage(doc.nombre)
          const found = await checkWhatsAppNumbers(phoneVariants(doc.telefono))
          const jid = found[0]?.jid ?? null
          if (!jid) {
            rows.pendientes += 1
            rows.errores.push(`${doc.nombre}: número no registrado en WhatsApp`)
            return
          }
          await sendMessage(jid, mensaje, { rsvpId: String(doc._id) })
          await Rsvp.updateOne(
            { _id: doc._id },
            {
              $set: {
                mensaje,
                enviado: true,
                status: 'enviado',
                whatsappJid: jid,
                whatsappCheckedAt: new Date(),
                lastError: null,
              },
            },
          )
          rows.enviados += 1
        } catch {
          rows.pendientes += 1
          rows.errores.push(doc.nombre)
        }
      }),
    )
    if (i + BROADCAST_BATCH < docs.length) await sleep(BROADCAST_BATCH_DELAY_MS)
  }
  res.json({ ok: true, ...rows })
})

adminRouter.delete('/rsvps/:id', requireAdmin, async (req, res) => {
  await Rsvp.deleteOne({ _id: req.params.id })
  res.json({ ok: true })
})