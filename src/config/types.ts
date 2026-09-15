export type PerformanceLevel = 'high' | 'medium' | 'low'

export interface GalleryImage {
  src: string
  alt: string
  /** Relación de aspecto CSS, p. ej. "3 / 4" */
  ratio: string
}

export interface EventDetail {
  icon: 'calendar' | 'clock' | 'mapPin' | 'gem'
  label: string
  value: string
}
