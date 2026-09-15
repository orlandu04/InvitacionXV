import { makeWASocket, fetchLatestBaileysVersion, makeCacheableSignalKeyStore } from '@whiskeysockets/baileys'
import { DisconnectReason } from '@whiskeysockets/baileys'
import type { WASocket } from '@whiskeysockets/baileys'
import pino from 'pino'
import QRCode from 'qrcode'
import { config } from '../config'
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

export async function sendMessage(toNumber: string, text: string): Promise<void> {
  if (!socket || status.state !== 'ready') {
    throw new Error('WhatsApp no conectado')
  }
  const jid = toNumber.includes('@') ? toNumber : `${toNumber}@s.whatsapp.net`
  await socket.sendMessage(jid, { text })
}

export async function logoutWhatsApp(): Promise<void> {
  if (!socket) throw new Error('WhatsApp no conectado')
  await socket.logout()
}