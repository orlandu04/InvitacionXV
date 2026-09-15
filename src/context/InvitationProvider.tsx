import { useMemo, useState, type ReactNode } from 'react'

import { InvitationContext } from './invitationContext'
import { useAudio } from '../hooks/useAudio'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { getPerformanceLevel } from '../hooks/usePerformance'

/** Proveedor del estado global de la invitación */
export function InvitationProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [opened, setOpened] = useState(false)
  const audio = useAudio()
  const isMobile = useMediaQuery('(max-width: 767px)')
  const performance = useMemo(() => getPerformanceLevel(), [])

  const value = useMemo(
    () => ({
      opened,
      openInvitation: () => setOpened(true),
      performance,
      isMobile,
      audio,
    }),
    [opened, performance, isMobile, audio],
  )

  return <InvitationContext.Provider value={value}>{children}</InvitationContext.Provider>
}
