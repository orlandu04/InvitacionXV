/** URL base del backend de confirmación. Definida en producción vía VITE_API_URL */
export const apiUrl: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000'