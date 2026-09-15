import { scrollToSection } from '../../hooks/useLenis'

interface ScrollIndicatorProps {
  target?: string
  label?: string
}

/** Indicador elegante de scroll: línea vertical con destello descendente */
export function ScrollIndicator({
  target = '#hero',
  label = 'Desliza',
}: ScrollIndicatorProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => scrollToSection(target)}
      aria-label="Desliza para descubrir la invitación"
      className="group mx-auto flex flex-col items-center gap-3 text-blush/90 transition-colors hover:text-white"
    >
      <span className="eyebrow tracking-[0.5em]">{label}</span>
      <span className="relative block h-14 w-px overflow-hidden bg-white/25" aria-hidden="true">
        <span className="absolute left-0 top-0 h-4 w-px bg-gradient-to-b from-transparent via-gold to-transparent [animation:float-y_2s_ease-in-out_infinite]" />
      </span>
    </button>
  )
}
