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
import { repairPhone } from '../utils/phone'
import { clearMongoAuth, useMongoAuthState } from './auth-state'
import { emitEvent } from './events'

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

/** Mensajes en PENDING esperando el ACK de WhatsApp, indexados por messageId */
const pendingByMsg = new Map<string, PendingEntry>()

/**
 * Mensajes que el watchdog marcó como "sin entrega": se retienen un tiempo
 * extra para capturar ACKs tardíos (WhatsApp puede entregar después de un rato).
 */
const lateByMsg = new Map<string, PendingEntry>()

const PENDING_TIMEOUT_MS = 90 * 1000
const LATE_KEEP_MS = 30 * 60 * 1000

function trackPending(messageId: string, jid: string, meta: { rsvpId?: string }): void {
  pendingByMsg.set(messageId, { jid, rsvpId: meta.rsvpId, at: Date.now() })
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

/** Vigila mensajes que se quedan en PENDING: WhatsApp no los está entregando. */
function startPendingWatchdog(): void {
  setInterval(
    () => {
      const now = Date.now()
      for (const [messageId, entry] of pendingByMsg) {
        if (now - entry.at < PENDING_TIMEOUT_MS) continue
        console.warn(
          `[whatsapp] sin entrega → ${entry.jid}${entry.rsvpId ? ` (rsvp ${entry.rsvpId})` : ''} · el número puede no tener WhatsApp, estar apagado o bloquear mensajes`,
        )
        if (entry.rsvpId) {
          void Rsvp.updateOne({ _id: entry.rsvpId }, { $set: { estado: 'no-entregado' } })
        }
        lateByMsg.set(messageId, { ...entry })
        pendingByMsg.delete(messageId)
      }
      for (const [messageId, entry] of lateByMsg) {
        if (now - entry.at > LATE_KEEP_MS) lateByMsg.delete(messageId)
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

function describeStatus(status: proto.WebMessageInfo.Status | null | undefined): string {
  if (status === null || status === undefined) return 'sin estado'
  return STATUS_LABELS[status] ?? `código ${status}`
}

export function getStatus(): ConnectionStatus {
  return status
}

export function isReady(): boolean {
  return status.state === 'ready' && socket !== null
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
      if (msgStatus === proto.WebMessageInfo.Status.ERROR) {
        console.error(
          `[whatsapp] entrega ERROR → ${jid}${entry?.rsvpId ? ` (rsvp ${entry.rsvpId})` : ''}`,
        )
        if (entry?.rsvpId) await Rsvp.updateOne({ _id: entry.rsvpId }, { $set: { estado: 'error' } })
        settleMessage(messageId)
        continue
      }
      if (
        msgStatus === proto.WebMessageInfo.Status.SERVER_ACK ||
        msgStatus === proto.WebMessageInfo.Status.DELIVERY_ACK ||
        msgStatus === proto.WebMessageInfo.Status.READ
      ) {
        const estado =
          msgStatus === proto.WebMessageInfo.Status.SERVER_ACK ? 'entregado-servidor' : 'entregado'
        console.log(
          `[whatsapp] ${label} → ${jid}${entry?.rsvpId ? ` (rsvp ${entry.rsvpId})` : ''}`,
        )
        if (entry?.rsvpId) await Rsvp.updateOne({ _id: entry.rsvpId }, { $set: { estado } })
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
      setStatus({ state: 'qr', qr: dataUrl, message: 'Escanea el código QR para vincular la línea' })
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
        lastDisconnect?.error as
          | { output?: { statusCode?: number } }
          | undefined
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

export async function sendMessage(
  toNumber: string,
  text: string,
  meta?: { rsvpId?: string },
): Promise<{ messageId?: string }> {
  if (!socket || status.state !== 'ready') {
    throw new Error('WhatsApp no conectado')
  }
  const jid = toNumber.includes('@') ? toNumber : `${repairPhone(toNumber)}@s.whatsapp.net`
  console.log(`[whatsapp] enviando → ${jid}`)
  const info = await socket.sendMessage(jid, { text })
  const messageId = info?.key?.id ?? undefined
  if (messageId) trackPending(messageId, jid, meta ?? {})
  await Rsvp.updateOne({ _id: meta?.rsvpId }, { $set: { estado: 'enviado' } })
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
 * Verifica (solo lectura) si los números dados están registrados en WhatsApp.
 * Devuelve únicamente los que existen, con su JID real — útil para detectar
 * si el número es válido y bajo qué formato (52 vs 521 en México).
 */
export async function checkWhatsAppNumbers(numbers: string[]): Promise<WhatsAppLookup[]> {
  if (!socket || status.state !== 'ready') {
    throw new Error('WhatsApp no conectado')
  }
  const unique = [...new Set(numbers)]
  const results = await socket.onWhatsApp(...unique)
  return (results ?? []).map(({ jid }) => ({ jid, phone: jid.split('@')[0] ?? '' }))
}