import { Rsvp } from '../db/models/Rsvp'
import { buildRsvpMessage } from '../settings'
import { checkWhatsAppNumbers, isSocketOpen, sendMessage } from './client'
import { phoneVariants } from '../utils/phone'

const MAX_ATTEMPTS = 3
const JITTER_MIN_MS = 3000
const JITTER_MAX_MS = 10000
const BACKOFF_BASE_MS = 20 * 1000
const SWEEP_INTERVAL_MS = 60 * 1000
const SWEEP_MAX_RETRIES = 5
const SWEEP_LIMIT = 20

interface QueueJob {
  rsvpId: string
  jid: string
  nombre: string
  runAt: number
  attempts: number
}

const jobs: QueueJob[] = []
let scanning = false

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function enqueue(job: Omit<QueueJob, 'runAt' | 'attempts'>): void {
  const runAt = Date.now() + JITTER_MIN_MS + Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS)
  jobs.push({ ...job, runAt, attempts: 0 })
  void start()
}

async function start(): Promise<void> {
  if (scanning) return
  scanning = true
  try {
    while (jobs.length > 0) {
      const next = jobs.reduce((acc, job) => (job.runAt <= acc.runAt ? job : acc))
      const wait = Math.max(0, next.runAt - Date.now())
      if (wait > 0) await sleep(wait)
      jobs.splice(jobs.indexOf(next), 1)
      await processJob(next)
    }
  } finally {
    scanning = false
  }
}

async function processJob(job: QueueJob): Promise<void> {
  const mensaje = await buildRsvpMessage(job.nombre)
  try {
    await sendMessage(job.jid, mensaje, { rsvpId: job.rsvpId })
  } catch (error) {
    job.attempts += 1
    const errMsg = error instanceof Error ? error.message : 'send_failed'
    if (job.attempts >= MAX_ATTEMPTS) {
      await Rsvp.updateOne(
        { _id: job.rsvpId },
        { $set: { status: 'fallido', lastError: `send_failed: ${errMsg}` } },
      )
      console.error(`[queue] fallido definitivo → ${job.jid} · ${errMsg}`)
      return
    }
    await Rsvp.updateOne(
      { _id: job.rsvpId },
      { $set: { status: 'pendiente', retryCount: job.attempts, lastError: `send_failed: ${errMsg}` } },
    )
    jobs.push({ ...job, runAt: Date.now() + BACKOFF_BASE_MS * 2 ** (job.attempts - 1) })
    console.warn(`[queue] reintento ${job.attempts}/${MAX_ATTEMPTS} → ${job.jid} · ${errMsg}`)
  }
}

/**
 * Encolar el envío de un RSVP ya resuelto (JID validado). El envío real ocurre
 * en 3-10 s con reintentos; nunca se hace en el mismo request del invitado.
 */
export function enqueueRsvpSend(job: { rsvpId: string; jid: string; nombre: string }): void {
  enqueue({ ...job })
}

/**
 * Reaper: barre RSVPs `pendiente` en MongoDB (sobrevive a reinicios de Render),
 * re-verifica si el número ya existe en WhatsApp y los reintenta; si agota
 * intentos los marca `fallido`.
 */
export function startRetrySweep(): void {
  setInterval(() => {
    void sweepPending()
  }, SWEEP_INTERVAL_MS).unref()
}

async function sweepPending(): Promise<void> {
  if (!isSocketOpen()) return
  const docs = await Rsvp.find({ status: 'pendiente', retryCount: { $lt: SWEEP_MAX_RETRIES } })
    .sort({ createdAt: 1 })
    .limit(SWEEP_LIMIT)

  for (const doc of docs) {
    const variants = phoneVariants(doc.telefono)
    let jid: string | null = null
    try {
      const found = await checkWhatsAppNumbers(variants)
      jid = found[0]?.jid ?? null
    } catch {
      jid = null
    }
    if (!jid) {
      const retries = (doc.retryCount ?? 0) + 1
      if (retries >= SWEEP_MAX_RETRIES) {
        await Rsvp.updateOne(
          { _id: doc._id },
          { $set: { status: 'fallido', lastError: 'not_on_whatsapp', retryCount: retries } },
        )
        console.warn(`[reintento] ${doc.nombre} (${doc.telefono}) agotó intentos: no existe en WhatsApp`)
      } else {
        await Rsvp.updateOne(
          { _id: doc._id },
          { $set: { retryCount: retries, whatsappCheckedAt: new Date() } },
        )
      }
      continue
    }
    await Rsvp.updateOne(
      { _id: doc._id },
      {
        $set: {
          status: 'enviado',
          enviado: true,
          whatsappJid: jid,
          whatsappCheckedAt: new Date(),
          lastError: null,
        },
      },
    )
    enqueueRsvpSend({ rsvpId: String(doc._id), jid, nombre: doc.nombre })
  }
}