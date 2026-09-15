import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryState {
  hasError: boolean
}

/**
 * Fallback elegante: si algo falla críticamente, la invitación muestra
 * un mensaje digno en lugar de una pantalla blanca o un error técnico.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[invitacion]', error, info.componentStack)
  }

  private readonly reload = (): void => {
    window.location.reload()
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blush via-rose-pastel/40 to-champagne px-6 text-center">
          <div>
            <span className="text-gilded font-script text-7xl">V</span>
            <h1 className="mt-6 font-display text-3xl font-medium text-rose-dark">
              Esta invitación tuvo un pequeño problema.
            </h1>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ink/70">
              Intenta actualizar la página para volver a la celebración.
            </p>
            <button
              type="button"
              onClick={this.reload}
              className="mt-8 rounded-full border border-gold px-8 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold-deep transition-colors hover:bg-gold/10"
            >
              Actualizar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
