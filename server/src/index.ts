import 'dotenv/config'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'node:path'
import { config } from './config'
import { connectDb } from './db/connect'
import { adminRouter } from './routes/admin'
import { rsvpRouter } from './routes/rsvp'
import { getStatus, startWhatsApp } from './whatsapp/client'

const app = express()

app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  }),
)
app.use(express.json({ limit: '64kb' }))
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, whatsapp: getStatus() })
})

app.use('/api/rsvps', rsvpRouter)
app.use('/api/admin', adminRouter)

const __dirname = path.dirname(__filename)
app.use(express.static(path.join(__dirname, '..', 'public')))
app.get('/admin', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'admin.html'))
})

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

async function main(): Promise<void> {
  await connectDb()
  await startWhatsApp()
  app.listen(config.port, () => {
    console.log(`[server] escuchando en http://localhost:${config.port}`)
    console.log(`[server] panel admin en http://localhost:${config.port}/admin`)
  })
}

main().catch((error) => {
  console.error('[server] error al iniciar', error)
  process.exit(1)
})