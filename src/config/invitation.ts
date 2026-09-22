import type { GalleryImage } from './types'

import gallery1 from '../assets/images/gallery-1.svg'
import gallery2 from '../assets/images/gallery-2.svg'
import gallery3 from '../assets/images/gallery-3.svg'
import gallery4 from '../assets/images/gallery-4.svg'
import gallery5 from '../assets/images/gallery-5.svg'
import gallery6 from '../assets/images/gallery-6.svg'

/* ─────────────────────────────────────────────────────────────
   CONFIGURACIÓN DE LA INVITACIÓN
   Edita este archivo para personalizar TODA la experiencia.
   No es necesario modificar ningún componente.
   ───────────────────────────────────────────────────────────── */

export const invitation = {
  /** Nombre de la quinceañera */
  name: 'Tania',
  shortName: 'Tani',
  initials: 'T',

  title: 'Mis XV años',
  tagline: 'Una noche para recordar',

  /** Fecha y hora del evento (hora local) — única fuente para countdown y evento */
  eventDate: '2026-11-28T16:00:00',

  /** Fecha límite para confirmar asistencia (formato legible) */
  rsvpDeadline: '28 de noviembre, 2026',

  welcome: {
    message: 'Una noche especial está por comenzar…',
    buttonLabel: 'Abrir invitación',
  },

  dedication: {
    eyebrow: 'Mis XV años',
    heading: 'Una nueva etapa',
    phrase:
      'Cada paso me trajo hasta aquí… ahora te invito a celebrar junto a mí el inicio de una nueva etapa.',
  },

  gallerySection: {
    eyebrow: 'Momentos',
    heading: 'Recuerdos que brillan',
    images: [
      { src: gallery1, alt: 'Retrato editorial de Tania con vestido de gala', ratio: '3 / 4' },
      { src: gallery2, alt: 'Tania entre flores rosas al atardecer', ratio: '4 / 5' },
      { src: gallery3, alt: 'Detalle del vestido y accesorios dorados', ratio: '1 / 1' },
      { src: gallery4, alt: 'Tania mirando el horizonte con velo de tul', ratio: '3 / 4' },
      { src: gallery5, alt: 'Risa espontánea durante la sesión fotográfica', ratio: '4 / 5' },
      { src: gallery6, alt: 'Tania con ramo de rosas en tonos pastel', ratio: '3 / 4' },
    ] satisfies GalleryImage[],
  },

  event: {
    eyebrow: 'El gran día',
    heading: 'Sábado 28 de noviembre, 2026',
    details: [
      { icon: 'calendar', label: 'Fecha', value: 'Sábado, 28 de noviembre 2026' },
      { icon: 'clock', label: 'Misa', value: '16:00 h · Iglesia del Sagrado Corazón de Balcones' },
      {
        icon: 'mapPin',
        label: 'Iglesia',
        value: 'Av. 3 Sur, Balcones del Sur, 72499 Heroica Puebla de Zaragoza, Pue',
      },
      { icon: 'gem', label: 'Recepción', value: '17:30 h · La Quinta de San Jorge' },
      {
        icon: 'mapPin',
        label: 'Salón',
        value: 'B 25 Sur 2530, Valle del Sur, 72300 Heroica Puebla de Zaragoza, Pue',
      },
    ],
  },

  ceremony: {
    eyebrow: 'Ceremonia',
    venue: 'Iglesia del Sagrado Corazón de Balcones',
    address: 'Av. 3 Sur, Balcones del Sur, 72499 Heroica Puebla de Zaragoza, Pue',
    time: '16:00 h',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=WQX7%2BM3+Heroica+Puebla+de+Zaragoza%2C+Pue',
  },

  dressCode: {
    heading: 'Vestimenta',
    value: 'Formal',
  },

  location: {
    eyebrow: 'Recepción',
    venue: 'La Quinta de San Jorge',
    address: 'B 25 Sur 2530, Valle del Sur, 72300 Heroica Puebla de Zaragoza, Pue',
    time: '17:30 h',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=B+25+Sur+2530%2C+Valle+del+Sur%2C+72300+Heroica+Puebla+de+Zaragoza%2C+Pue',
  },

  music: {
    src: '/audio/theme.mp3',
    title: 'Close to You (They Long to Be)',
    /** Volumen inicial 0 – 1 */
    initialVolume: 0.65,
  },

  rsvp: {
    heading: 'Será un honor compartir esta noche contigo.',
    buttonLabel: 'Confirmar asistencia',
    note: `Por favor confirma antes del ${'28 de noviembre, 2026'}.`,
  },

  finale: {
    thanks: 'Gracias por acompañarme',
    signature: 'Con cariño,',
    family: 'Familia Jimenez Flores',
  },

  seo: {
    title: 'Tania | Mis XV Años',
    description:
      'Una noche para recordar. Te invito a celebrar mis XV años — confirma tu asistencia.',
    url: 'https://invitacion-tania.ejemplo.com',
  },
} as const

export type Invitation = typeof invitation
