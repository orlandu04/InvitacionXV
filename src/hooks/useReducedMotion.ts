import { useMediaQuery } from './useMediaQuery'

/** Respeta la preferencia del sistema de reducir movimiento */
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
