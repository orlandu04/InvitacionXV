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

const pendingByJid = new Map<string, Array<{ rsvpId?: string; at: number }>>()

function trackPending(jid: string, meta: { rsvpId?: string }): void {
  const queue = pendingByJid.get(jid) ?? []
  queue.push({ rsvpId: meta.rsvpId, at: Date.now() })
  pendingByJid.set(jid, queue)
  const now = Date.now()
  const fresh = queue.filter((entry) => now - entry.at < 5 * 60 * 1000)
  pendingByJid.set(jid, fresh)
}

function shiftMatched(jid: string): { rsvpId?: string } {
  const queue = pendingByJid.get(jid)
  if (!queue || queue.length === 0) return {}
  const [first] = queue.splice(0, 1)
  if (queue.length === 0) pendingByJid.delete(jid)
  return first ?? {}
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

  nextSocket.ev.on('creds.update', () => {
    void saveCreds()
  })

  nextSocket.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      const jid = update.key?.remoteJid ?? ''
      const status = update.update?.status
      const { rsvpId } = shiftMatched(jid)
      const label = describeStatus(status)
      if (status === proto.WebMessageInfo.Status.ERROR) {
        console.error(
          `[whatsapp] entrega ERROR → ${jid}${rsvpId ? ` (rsvp ${rsvpId})` : ''}`,
        )
        if (rsvpId) await Rsvp.updateOne({ _id: rsvpId }, { $set: { estado: 'error' } })
        continue
      }
      if (
        status === proto.WebMessageInfo.Status.DELIVERY_ACK ||
        status === proto.WebMessageInfo.Status.READ
      ) {
        console.log(
          `[whatsapp] entregado ✓ → ${jid}${rsvpId ? ` (rsvp ${rsvpId})` : ''} · ${label}`,
        )
        if (rsvpId) await Rsvp.updateOne({ _id: rsvpId }, { $set: { estado: 'entregado' } })
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
): Promise<void> {
  if (!socket || status.state !== 'ready') {
    throw new Error('WhatsApp no conectado')
  }
  const jid = toNumber.includes('@') ? toNumber : `${repairPhone(toNumber)}@s.whatsapp.net`
  console.log(`[whatsapp] enviando → ${jid}`)
  if (meta?.rsvpId) trackPending(jid, { rsvpId: meta.rsvpId })
  await socket.sendMessage(jid, { text })
  await Rsvp.updateOne({ _id: meta?.rsvpId }, { $set: { estado: 'enviado' } })
}

export async function logoutWhatsApp(): Promise<void> {
  if (!socket) throw new Error('WhatsApp no conectado')
  await socket.logout()
}