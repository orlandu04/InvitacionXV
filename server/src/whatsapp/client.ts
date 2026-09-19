import {
  makeWASocket,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  proto,
} from '@whiskeysockets/baileys'
import { DisconnectReason } from '@whiskeysockets/baileys'
import type { WASocket } from '@whiskeysockets/baileys'
import pino from 'pino'
import QRCode from 'qrcode'
import { config } from '../config'
import { Rsvp } from '../db/models/Rsvp'
import { clearMongoAuth, useMongoAuthState } from './auth-state'
import { emitEvent } from './events'
import { startRetrySweep } from './queue'

export interface ConnectionStatus {
  state: 'connecting' | 'qr' | 'ready' | 'closed' | 'logged_out'
  message?: string
  qr?: string
  phone?: string
}

let socket: WASocket | null = null
let reconnectTimer: NodeJS.Timeout | null = null
let status: ConnectionStatus = { state: 'connecting', message: 'Conectando…' }
let watchdogStarted = false

interface PendingEntry {
  jid: string
  rsvpId?: string
  at: number
}

const PENDING_TIMEOUT_MS = 90 * 1000
const LATE_KEEP_MS = 30 * 60 * 1000

// ✅ FIX #4 — cachés en memoria SOLO como respaldo rápido.
// La fuente de verdad es MongoDB (campos waMessageId + waPendingAt en Rsvp).
const pendingByMsg = new Map<string, PendingEntry>()
const lateByMsg = new Map<string, PendingEntry>()

/**
 * ✅ FIX #4 — Persiste el pending en Mongo para sobrevivir reinicios.
 * Guarda waMessageId + waPendingAt en el doc del RSVP.
 */
async function trackPending(
  messageId: string,
  jid: string,
  meta: { rsvpId?: string },
): Promise<void> {
  pendingByMsg.set(messageId, { jid, rsvpId: meta.rsvpId, at: Date.now() })
  if (meta.rsvpId) {
    await Rsvp.updateOne(
      { _id: meta.rsvpId },
      { $set: { waMessageId: messageId, waPendingAt: new Date() } },
    )
  }
}

function consumePending(messageId?: string | null): PendingEntry | undefined {
  if (!messageId) return undefined
  return pendingByMsg.get(messageId) ?? lateByMsg.get(messageId)
}

function settleMessage(messageId?: string | null): void {
  if (!messageId) return
  pendingByMsg.delete(messageId)
  lateByMsg.delete(messageId)
}

/**
 * Vigila mensajes que se quedan en PENDING.
 * ✅ FIX #4 — Barre por DB (waPendingAt) además del Map en memoria,
 * así sobrevive reinicios de Render.
 */
function startPendingWatchdog(): void {
  setInterval(
    async () => {
      const now = Date.now()

      // 1) Barrido en memoria (rápido)
      for (const [messageId, entry] of pendingByMsg) {
        if (now - entry.at < PENDING_TIMEOUT_MS) continue
        console.warn(
          `[whatsapp] sin entrega → ${entry.jid}${entry.rsvpId ? ` (rsvp ${entry.rsvpId})` : ''} · el número puede no tener WhatsApp, estar apagado o bloquear mensajes`,
        )
        if (entry.rsvpId) {
          await Rsvp.updateOne(
            { _id: entry.rsvpId },
            { $set: { status: 'fallido', lastError: 'no_delivery' } },
          )
        }
        lateByMsg.set(messageId, { ...entry })
        pendingByMsg.delete(messageId)
      }
      for (const [messageId, entry] of lateByMsg) {
        if (now - entry.at > LATE_KEEP_MS) lateByMsg.delete(messageId)
      }

      // 2) Barrido en DB (sobrevive reinicios)
      const cutoff = new Date(now - PENDING_TIMEOUT_MS)
      const stuck = await Rsvp.find({
        status: 'enviado',
        waPendingAt: { $type: 'date', $lte: cutoff },
        waMessageId: { $exists: true, $ne: null },
      }).limit(50)
      for (const doc of stuck) {
        console.warn(`[whatsapp] sin entrega (DB) → rsvp ${doc._id} · ${doc.telefono}`)
        await Rsvp.updateOne(
          { _id: doc._id },
          { $set: { status: 'fallido', lastError: 'no_delivery' }, $unset: { waPendingAt: '' } },
        )
      }
    },
    30 * 1000,
  ).unref()
}

const STATUS_LABELS: Record<number, string> = {
  [proto.WebMessageInfo.Status.ERROR]: 'error',
  [proto.WebMessageInfo.Status.PENDING]: 'enviado al servidor',
  [proto.WebMessageInfo.Status.SERVER_ACK]: 'entregado a WhatsApp',
  [proto.WebMessageInfo.Status.DELIVERY_ACK]: 'entregado al teléfono',
  [proto.WebMessageInfo.Status.READ]: 'leído',
  [proto.WebMessageInfo.Status.PLAYED]: 'reproducido',
}

function describeStatus(s: proto.WebMessageInfo.Status | null | undefined): string {
  if (s === null || s === undefined) return 'sin estado'
  return STATUS_LABELS[s] ?? `código ${s}`
}

export function getStatus(): ConnectionStatus {
  return status
}

export function isReady(): boolean {
  return status.state === 'ready' && socket !== null
}

/**
 * ✅ FIX #2 — Chequeo REAL del socket.
 * En Baileys v6 `socket.ws` es un WebSocketClient con getter `isOpen` (no readyState).
 */
export function isSocketOpen(): boolean {
  return status.state === 'ready' && socket !== null && socket.ws.isOpen === true
}

function setStatus(next: ConnectionStatus): void {
  status = next
  emitEvent(status)
}

export async function startWhatsApp(): Promise<void> {
  const { state, saveCreds } = await useMongoAuthState()

  let version: [number, number, number] = [2, 3000, 1015912643]
  try {
    const latest = await fetchLatestBaileysVersion()
    version = latest.version
  } catch {
    console.warn('[whatsapp] no se pudo obtener la versión más reciente, usando versión por defecto')
  }

  const logger = pino({ level: config.nodeEnv === 'development' ? 'debug' : 'silent' })

  const nextSocket = makeWASocket({
    version,
    logger,
    browser: ['Invitacion XV', 'Chrome', '122.0.0.0'],
    markOnlineOnConnect: false,
    printQRInTerminal: config.nodeEnv === 'development',
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
  })
  socket = nextSocket

  if (!watchdogStarted) {
    watchdogStarted = true
    startPendingWatchdog()
    startRetrySweep()
  }

  nextSocket.ev.on('creds.update', () => {
    void saveCreds()
  })

  nextSocket.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      const messageId = update.key?.id
      const jid = update.key?.remoteJid ?? ''
      const msgStatus = update.update?.status
      const entry = consumePending(messageId)
      const label = describeStatus(msgStatus)

      // ✅ FIX #4 — Al recibir ACK, limpia waPendingAt en DB
      const cleanupDb = async () => {
        if (entry?.rsvpId) {
          await Rsvp.updateOne(
            { _id: entry.rsvpId },
            { $unset: { waPendingAt: '' } },
          )
        }
      }

      if (msgStatus === proto.WebMessageInfo.Status.ERROR) {
        console.error(
          `[whatsapp] entrega ERROR → ${jid}${entry?.rsvpId ? ` (rsvp ${entry.rsvpId})` : ''}`,
        )
        if (entry?.rsvpId) {
          await Rsvp.updateOne(
            { _id: entry.rsvpId },
            { $set: { status: 'fallido', lastError: 'whatsapp_error' }, $unset: { waPendingAt: '' } },
          )
        }
        settleMessage(messageId)
        continue
      }

      if (
        msgStatus === proto.WebMessageInfo.Status.SERVER_ACK ||
        msgStatus === proto.WebMessageInfo.Status.DELIVERY_ACK ||
        msgStatus === proto.WebMessageInfo.Status.READ
      ) {
        console.log(
          `[whatsapp] ${label} → ${jid}${entry?.rsvpId ? ` (rsvp ${entry.rsvpId})` : ''}`,
        )
        if (entry?.rsvpId) {
          await Rsvp.updateOne(
            { _id: entry.rsvpId },
            { $set: { status: 'entregado' } },
          )
        }
        await cleanupDb()
        settleMessage(messageId)
      }
    }
  })

  nextSocket.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update

    if (qr) {
      const dataUrl = await QRCode.toDataURL(qr, {
        width: 340,
        margin: 2,
        errorCorrectionLevel: 'M',
      })
      setStatus({
        state: 'qr',
        qr: dataUrl,
        message: 'Escanea el código QR para vincular la línea',
      })
      return
    }

    if (connection === 'open') {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      const jid = nextSocket.user?.id ?? ''
      setStatus({
        state: 'ready',
        message: 'Conectado a WhatsApp',
        phone: jid.split('@')[0] ?? undefined,
      })
      return
    }

    if (connection === 'close') {
      socket = null
      const statusCode = (
        lastDisconnect?.error as { output?: { statusCode?: number } } | undefined
      )?.output?.statusCode

      if (statusCode === DisconnectReason.loggedOut) {
        await clearMongoAuth()
        setStatus({
          state: 'logged_out',
          message: 'Sesión cerrada. Se generará un nuevo QR para vincular la línea.',
        })
        if (!reconnectTimer) {
          reconnectTimer = setTimeout(() => {
            reconnectTimer = null
            void startWhatsApp()
          }, 1500)
        }
        return
      }

      setStatus({ state: 'closed', message: 'Conexión perdida, reconectando…' })
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null
          void startWhatsApp()
        }, 5000)
      }
    }
  })

  console.log('[whatsapp] cliente iniciado')
}

/**
 * ✅ FIX #1 — sendMessage SOLO acepta JIDs validados (con @).
 * Rechaza números crudos para que nunca se derive un JID a mano.
 *
 * ✅ FIX #2 — Usa isSocketOpen() en vez de solo status.state.
 */
export async function sendMessage(
  toJid: string,
  text: string,
  meta?: { rsvpId?: string },
): Promise<{ messageId?: string }> {
  // ✅ FIX #1: rechazo explícito
  if (!toJid.includes('@')) {
    throw new Error(
      `sendMessage requiere un JID validado (ej. 521234567890@s.whatsapp.net), recibió: ${toJid}`,
    )
  }

  // ✅ FIX #2: chequeo real del socket
  if (!isSocketOpen()) {
    throw new Error('WhatsApp no conectado o socket cerrado')
  }

  // Narrowing: isSocketOpen() garantiza socket no-null
  const sock = socket as WASocket
  const jid = toJid

  console.log(`[whatsapp] enviando → ${jid}`)
  const info = await sock.sendMessage(jid, { text })
  const messageId = info?.key?.id ?? undefined

  if (messageId) {
    await trackPending(messageId, jid, meta ?? {})
  }

  if (meta?.rsvpId) {
    await Rsvp.updateOne(
      { _id: meta.rsvpId },
      { $set: { status: 'enviado', lastError: null } },
    )
  }

  return { messageId }
}

export async function logoutWhatsApp(): Promise<void> {
  if (!socket) throw new Error('WhatsApp no conectado')
  await socket.logout()
}

export interface WhatsAppLookup {
  jid: string
  phone: string
}

/**
 * ✅ FIX #3 — Filtra `exists: true` y prioriza `521` cuando ambos formatos existen.
 * Devuelve solo JIDs realmente registrados en WhatsApp, ordenados por prioridad.
 */
export async function checkWhatsAppNumbers(numbers: string[]): Promise<WhatsAppLookup[]> {
  if (!isSocketOpen()) {
    throw new Error('WhatsApp no conectado')
  }
  const sock = socket as WASocket
  const unique = [...new Set(numbers)]
  const results = await sock.onWhatsApp(...unique)

  // ✅ FIX #3a: SOLO los que existen
  const existentes = (results ?? [])
    .filter((r) => r?.exists === true)
    .map((r) => ({ jid: r.jid, phone: r.jid.split('@')[0] ?? '' }))

  // ✅ FIX #3b: prioriza 521 sobre 52 (móviles MX suelen estar registrados con el 1)
  existentes.sort((a, b) => {
    const aIs521 = a.jid.startsWith('521') ? 0 : 1
    const bIs521 = b.jid.startsWith('521') ? 0 : 1
    return aIs521 - bIs521
  })

  return existentes
}