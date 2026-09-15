import { useContext } from 'react'

import type { InvitationState } from '../context/invitationContext'
import { InvitationContext } from '../context/invitationContext'

/** Acceso al estado global de la invitación (apertura, audio, performance) */
export function useInvitation(): InvitationState {
  const ctx = useContext(InvitationContext)
  if (!ctx) throw new Error('useInvitation debe usarse dentro de InvitationProvider')
  return ctx
}
