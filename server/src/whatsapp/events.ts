type Handler = (data: unknown) => void

const listeners = new Set<Handler>()

export function onEvent(handler: Handler): () => void {
  listeners.add(handler)
  return () => {
    listeners.delete(handler)
  }
}

export function emitEvent(data: unknown): void {
  for (const handler of listeners) handler(data)
}