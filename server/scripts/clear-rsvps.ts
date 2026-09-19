import mongoose from 'mongoose'
import { Rsvp } from '../src/db/models/Rsvp'

// La URI va SIEMPRE por variable de entorno; nunca hardcodear ni imprimir.
const uri = process.env.MONGODB_URI
if (!uri) {
  console.error('[clear-rsvps] define MONGODB_URI para continuar')
  process.exit(1)
}

async function main(): Promise<void> {
  const dbName = uri.split('?')[0].split('/').pop() ?? ''
  if (dbName !== 'invitacion-xv') {
    console.error(`[clear-rsvps] DB "${dbName}" no es invitacion-xv. Aborto.`)
    process.exit(1)
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 })
  const antes = await Rsvp.countDocuments()
  await Rsvp.deleteMany({})
  console.log(
    `[clear-rsvps] borrados ${antes} RSVPs · whatsappauths y settings intactos · índices conservados`,
  )
  await mongoose.disconnect()
}

main().catch((error) => {
  console.error('[clear-rsvps] error:', (error as Error).message)
  process.exit(1)
})