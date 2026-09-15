import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useCallback, useEffect, useRef } from 'react'

import type { GalleryImage } from '../../config/types'
import { getLenis } from '../../hooks/useLenis'

interface LightboxProps {
  images: GalleryImage[]
  index: number | null
  onClose: () => void
  onNavigate: (index: number) => void
}

/**
 * Lightbox fullscreen premium con navegación por botones,
 * teclado (Esc / flechas) y gestos de deslizamiento táctil.
 */
export function Lightbox({ images, index, onClose, onNavigate }: LightboxProps): React.JSX.Element {
  const closeRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  const isOpen = index !== null

  const goPrev = useCallback(() => {
    if (index === null) return
    onNavigate((index - 1 + images.length) % images.length)
  }, [index, images.length, onNavigate])

  const goNext = useCallback(() => {
    if (index === null) return
    onNavigate((index + 1) % images.length)
  }, [index, images.length, onNavigate])

  /* Teclado */
  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowLeft') goPrev()
      else if (event.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose, goPrev, goNext])

  /* Bloqueo de scroll + gestión de foco */
  useEffect(() => {
    if (!isOpen) return
    getLenis()?.stop()
    document.documentElement.style.overflow = 'hidden'
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => {
      getLenis()?.start()
      document.documentElement.style.overflow = ''
      previous?.focus()
    }
  }, [isOpen])

  const current = index !== null ? images[index] : null

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Fotografía ${((index ?? 0) + 1)} de ${images.length}: ${current.alt}`}
          className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-ink/92 p-4 backdrop-blur-md sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
          onTouchStart={(event) => {
            touchStartX.current = event.touches[0].clientX
          }}
          onTouchEnd={(event) => {
            if (touchStartX.current === null) return
            const delta = event.changedTouches[0].clientX - touchStartX.current
            if (Math.abs(delta) > 48) (delta < 0 ? goNext : goPrev)()
            touchStartX.current = null
          }}
        >
          {/* Contador */}
          <div className="absolute left-6 top-6 font-display text-sm tracking-[0.3em] text-blush/80">
            {String((index ?? 0) + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
          </div>

          {/* Cerrar */}
          <motion.button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar galería"
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-5 top-5 rounded-full border border-white/25 p-3 text-blush transition-colors hover:border-gold hover:text-gold-light sm:right-8 sm:top-8"
          >
            <X size={20} strokeWidth={1.5} />
          </motion.button>

          {/* Fotografía */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.figure
              key={index}
              initial={{ opacity: 0, scale: 0.94, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -16 }}
              transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="flex max-h-full flex-col items-center gap-4"
            >
              <img
                src={current.src}
                alt={current.alt}
                className="max-h-[76vh] w-auto max-w-full rounded-lg object-contain shadow-[0_40px_90px_-20px_rgba(0,0,0,0.8)] ring-1 ring-gold/30"
                draggable={false}
              />
              {current.alt && (
                <figcaption className="max-w-xl text-center font-display text-sm italic text-blush/75">
                  {current.alt}
                </figcaption>
              )}
            </motion.figure>
          </AnimatePresence>

          {/* Navegación */}
          <div className="mt-6 flex items-center gap-6">
            <motion.button
              type="button"
              onClick={goPrev}
              aria-label="Fotografía anterior"
              whileHover={{ scale: 1.12, x: -3 }}
              whileTap={{ scale: 0.92 }}
              className="rounded-full border border-white/25 p-3 text-blush transition-colors hover:border-gold hover:text-gold-light"
            >
              <ChevronLeft size={20} strokeWidth={1.5} />
            </motion.button>
            <div className="gold-hairline w-16" aria-hidden="true" />
            <motion.button
              type="button"
              onClick={goNext}
              aria-label="Fotografía siguiente"
              whileHover={{ scale: 1.12, x: 3 }}
              whileTap={{ scale: 0.92 }}
              className="rounded-full border border-white/25 p-3 text-blush transition-colors hover:border-gold hover:text-gold-light"
            >
              <ChevronRight size={20} strokeWidth={1.5} />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
