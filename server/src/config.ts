import 'dotenv/config'

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 4000),

  /** URI de MongoDB (MongoDB Atlas free tier en producción) */
  mongodbUri:
    process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invitacion-xv',

  /** Contraseña del panel admin (/admin) */
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

  /** Orígenes permitidos por CORS (separados por coma) */
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:4173')
    .split(',')
    .map((origin) => origin.trim()),

  /** Datos del evento para personalizar el mensaje */
  quinceanera: process.env.QUINCEANERA || 'Tania',
  eventDate: process.env.EVENT_DATE || '28 de noviembre, 2026',

  /** Plantilla del mensaje de confirmación (editable desde el panel admin) */
  defaultMessage:
    process.env.DEFAULT_MESSAGE ||
    'Hola {nombre}, recibimos tu confirmación para los XV años de {quinceanera} el {fecha}. ¡Nos vemos ahí! ✨',

  /** Código de país que se agrega si el invitado escribe solo 10 dígitos */
  defaultCountryCode: process.env.DEFAULT_COUNTRY_CODE || '52',
} as const