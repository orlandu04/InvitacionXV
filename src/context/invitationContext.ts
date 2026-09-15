import { createContext } from 'react'

import type { PerformanceLevel } from '../config/types'
import type { UseAudioReturn } from '../hooks/useAudio'

export interface InvitationState {
  /** true cuando el usuario abrió la invitación */
  opened: boolean
  openInvitation: () => void
  performance: PerformanceLevel
  isMobile: boolean
  audio: UseAudioReturn
}

export const InvitationContext = createContext<InvitationState | null>(null)
