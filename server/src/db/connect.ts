import mongoose from 'mongoose'
import { config } from '../config'

function logDatasource(): void {
  const env = process.env.MONGODB_URI
  if (!env) {
    console.warn('[db] MONGODB_URI NO definida en el entorno → usando fallback local mongodb://127.0.0.1:27017')
    return
  }
  const sanitized = env.replace(/:[^:@/]*@/, ':***@')
  console.log(`[db] MONGODB_URI definida: ${sanitized}`)
}

export async function connectDb(): Promise<void> {
  logDatasource()
  await mongoose.connect(config.mongodbUri)
  console.log('[db] MongoDB conectado')
}