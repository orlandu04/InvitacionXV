import { lazy, Suspense, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import { CurtainTransition } from './components/effects/CurtainTransition'
import { CustomCursor } from './components/effects/CustomCursor'
import { ErrorBoundary } from './components/layout/ErrorBoundary'
import { MusicPlayer } from './components/layout/MusicPlayer'
import { InvitationProvider } from './context/InvitationProvider'
import { useInvitation } from './hooks/useInvitation'
import { useLenis } from './hooks/useLenis'
import { getPerformanceLevel } from './hooks/usePerformance'
import { Countdown } from './sections/Countdown'
import { Dedication } from './sections/Dedication'
import { DressCode } from './sections/DressCode'
import { Event } from './sections/Event'
import { Finale } from './sections/Finale'
import { Hero } from './sections/Hero'
import { Intro } from './sections/Intro'
import { Location } from './sections/Location'
import { Rsvp } from './sections/Rsvp'
import { invitation } from './config/invitation'

/* Three.js SOLO se carga cuando el usuario abre la invitación */
const Particles = lazy(() => import('./components/effects/Particles'))

function Experience(): React.JSX.Element {
  const { opened } = useInvitation()
  useLenis(opened)

  /* Bloquear scroll durante la intro */
  useEffect(() => {
    document.documentElement.style.overflow = opened ? '' : 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [opened])

  /* Recalcular disparadores de scroll cuando la experiencia ya montó */
  useEffect(() => {
    if (!opened) return
    const timers = [
      window.setTimeout(() => ScrollTrigger.refresh(), 600),
      window.setTimeout(() => ScrollTrigger.refresh(), 1800),
    ]
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [opened])

  return (
    <>
      {/* Pantalla de carga + bienvenida */}
      <AnimatePresence>{!opened && <Intro key="intro" />}</AnimatePresence>

      {opened && (
        <>
          <Suspense fallback={null}>
            <Particles />
          </Suspense>

          <main aria-label={`Invitación a los XV años de ${invitation.name}`}>
            <Hero />
            <CurtainTransition />
            <Dedication />
            <Countdown />
            <Event />
            <DressCode />
            <Location />
            <Rsvp />
            <Finale />
          </main>

          <MusicPlayer />
        </>
      )}

      <CustomCursor />
    </>
  )
}

export default function App(): React.JSX.Element {
  /* Clase global para dispositivos de gama baja */
  useEffect(() => {
    document.documentElement.classList.toggle('no-blur', getPerformanceLevel() === 'low')
  }, [])

  return (
    <ErrorBoundary>
      <InvitationProvider>
        <Experience />
      </InvitationProvider>
    </ErrorBoundary>
  )
}
