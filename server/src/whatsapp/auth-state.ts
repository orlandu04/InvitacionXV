import { BufferJSON, initAuthCreds, proto } from '@whiskeysockets/baileys'
import type {
  AuthenticationCreds,
  AuthenticationState,
  SignalDataSet,
} from '@whiskeysockets/baileys/lib/Types'
import { WhatsAppAuth } from '../db/models/WhatsAppAuth'

/** Serializa valores (Buffers/Uint8Array → base64) para guardarlos en Mongo. */
const encode = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, BufferJSON.replacer))

/** Deserializa desde Mongo reconstruyendo Buffers/Uint8Array. */
const decode = <T>(value: unknown): T =>
  JSON.parse(JSON.stringify(value), BufferJSON.reviver) as T

const readDoc = async (key: string): Promise<unknown | null> => {
  const doc = await WhatsAppAuth.findOne({ key }).lean()
  return doc ? doc.value : null
}

const writeDoc = async (key: string, value: unknown): Promise<void> => {
  await WhatsAppAuth.updateOne({ key }, { $set: { value: encode(value) } }, { upsert: true })
}

const deleteDoc = async (key: string): Promise<void> => {
  await WhatsAppAuth.deleteOne({ key })
}

/**
 * Estado de autenticación de Baileys persistido en MongoDB.
 * Así la sesión de WhatsApp sobrevive a redespliegues de Render
 * (cuyo disco es efímero) y no hay que escanear el QR de nuevo.
 */
export async function useMongoAuthState(): Promise<{
  state: AuthenticationState
  saveCreds: () => Promise<void>
}> {
  const stored = await readDoc('creds')
  const creds: AuthenticationCreds = stored ? decode<AuthenticationCreds>(stored) : initAuthCreds()

  const keys = {
    get: async (_type: string, ids: string[]): Promise<Record<string, unknown>> => {
      const data: Record<string, unknown> = {}
      await Promise.all(
        ids.map(async (id) => {
          let value = await readDoc(`keys:${_type}:${id}`)
          if (value) {
            value = decode(value)
            if (_type === 'app-state-sync-key') {
              value = proto.Message.AppStateSyncKeyData.fromObject(value as Record<string, unknown>)
            }
            data[id] = value
          } else {
            data[id] = null
          }
        }),
      )
      return data
    },
    set: async (data: SignalDataSet): Promise<void> => {
      await Promise.all(
        Object.entries(data).flatMap(([category, ids]) =>
          Object.entries((ids as Record<string, unknown>) ?? {}).map(async ([id, value]) => {
            if (value) await writeDoc(`keys:${category}:${id}`, value)
            else await deleteDoc(`keys:${category}:${id}`)
          }),
        ),
      )
    },
  }

  return {
    state: { creds, keys } as AuthenticationState,
    saveCreds: async () => {
      await writeDoc('creds', creds)
    },
  }
}

/** Borra toda la autenticación guardada (para vincular una línea nueva). */
export async function clearMongoAuth(): Promise<void> {
  await WhatsAppAuth.deleteMany({})
}