/** Paleta centralizada — consumida por JS (partículas, canvas, sintetizador) */
export const palette = {
  blush: '#FFF5FA',
  rosePastel: '#FBCFE8',
  rose: '#F9A8D4',
  roseIntense: '#EC4899',
  roseDeep: '#BE185D',
  roseDark: '#831843',
  champagne: '#FFF7ED',
  gold: '#D4AF37',
  goldLight: '#F6E27A',
  ink: '#171217',
} as const

export type PaletteKey = keyof typeof palette
