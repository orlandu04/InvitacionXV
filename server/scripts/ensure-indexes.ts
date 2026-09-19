import mongoose from 'mongoose'
import { Rsvp } from '../src/db/models/Rsvp'
import { config } from '../src/config'

/**
 * Crea los índices de `rsvps` de forma idempotente (aunque Mongoose traiga
 * autoIndex false en producción) y muestra los índices resultantes.
 *
 * Uso: npm run ensure-indexes
 */
async function main(): Promise<void> {
  await mongoose.connect(config.mongodbUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 10000,
  })
  await Rsvp.createIndexes()
  const indexes = await Rsvp.collection.indexes()
  console.log(
    '[ensure-indexes] Índices de rsvps:',
    indexes.map((index) => index.name).join(', ') || '(ninguno)',
  )
  await mongoose.disconnect()
}

main().catch((error) => {
  console.error('[ensure-indexes] error:', error)
  process.exit(1)
})