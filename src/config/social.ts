/** Datos sociales y de contacto — usados por RSVP y compartir */
export const social = {
  /** Número de WhatsApp en formato internacional SIN "+", espacios ni guiones */
  whatsapp: '5215512345678',

  /** Mensaje preparado al confirmar asistencia */
  rsvpMessage: (name: string, date: string): string =>
    `Hola, confirmo mi asistencia a los XV años de ${name}, el ${date}. ¡Nos vemos ahí!`,

  hashtag: '#MisXVAños',
} as const

export const buildWhatsAppUrl = (message: string): string =>
  `https://wa.me/${social.whatsapp}?text=${encodeURIComponent(message)}`
