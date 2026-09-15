import { AnimatePresence, motion } from 'framer-motion'
import { VolumeX } from 'lucide-react'
import { useState } from 'react'

import { invitation } from '../../config/invitation'
import { useInvitation } from '../../hooks/useInvitation'

/**
 * Reproductor flotante minimalista: disco giratorio con barras de
 * ecualizador y control de volumen desplegable. Solo aparece después
 * de abrir la invitación y nunca suena antes de la interacción del usuario.
 */
export function MusicPlayer(): React.JSX.Element | null {
  const { opened, audio } = useInvitation()
  const [showVolume, setShowVolume] = useState(false)

  if (!opened || audio.status === 'unavailable') return null

  const playing = audio.status === 'playing'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed bottom-5 right-5 z-[90] sm:bottom-7 sm:right-7"
    >
      {/* Volumen */}
      <AnimatePresence>
        {showVolume && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="glass-panel absolute bottom-full right-0 mb-3 rounded-full px-4 py-3"
          >
            <label className="sr-only" htmlFor="music-volume">
              Volumen de la música
            </label>
            <input
              id="music-volume"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={audio.volume}
              onChange={(event) => audio.setVolume(Number(event.target.value))}
              className="h-1 w-28 cursor-pointer appearance-none rounded-full bg-white/25 accent-gold [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* anillo pulsante al reproducir */}
        {playing && (
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-gold/60 [animation:pulse-ring_2.4s_ease-out_infinite]"
          />
        )}

        <motion.button
          type="button"
          onClick={() => {
            audio.toggle()
            setShowVolume(false)
          }}
          onDoubleClick={() => setShowVolume((v) => !v)}
          whileTap={{ scale: 0.9 }}
          aria-pressed={playing}
          aria-label={
            playing ? `Pausar ${invitation.music.title}` : `Reproducir ${invitation.music.title}`
          }
          title={`${invitation.music.title} · doble clic para volumen`}
          className="glass-panel relative flex h-13 w-13 items-center justify-center rounded-full p-3.5 text-blush shadow-lg transition-transform hover:scale-105"
        >
          {/* disco girando */}
          <span
            aria-hidden="true"
            className={`absolute inset-1 rounded-full border border-dashed border-gold/50 ${
              playing ? '[animation:spin_9s_linear_infinite]' : ''
            }`}
          />

          <AnimatePresence mode="wait" initial={false}>
            {playing ? (
              <motion.span
                key="on"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="flex items-end gap-[2.5px]"
                aria-hidden="true"
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="eq-bar w-[2.5px] rounded-full bg-gold"
                    style={{
                      height: 12,
                      animationDelay: `${i * 0.18}s`,
                      transform: 'scaleY(0.35)',
                    }}
                  />
                ))}
              </motion.span>
            ) : (
              <motion.span
                key="off"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                aria-hidden="true"
                className="text-blush/85"
              >
                <VolumeX size={17} strokeWidth={1.6} />
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.div>
  )
}
