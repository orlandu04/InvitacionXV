import { useState } from 'react'

import { Lightbox } from '../components/gallery/Lightbox'
import { FloralDecoration } from '../components/effects/FloralDecoration'
import { ParallaxImage } from '../components/ui/ParallaxImage'
import { SectionTitle } from '../components/ui/SectionTitle'
import { invitation } from '../config/invitation'

/** Composición editorial por índice (grid de revista, no cards) */
const COLLAGE: Array<{ span: string; rotate: string; speed: number }> = [
  { span: 'col-span-2 row-span-2', rotate: 'rotate-0', speed: 6 },
  { span: 'col-span-1 row-span-1', rotate: '-rotate-[1.2deg]', speed: 11 },
  { span: 'col-span-1 row-span-1', rotate: 'rotate-[1.4deg]', speed: 8 },
  { span: 'col-span-1 row-span-2', rotate: 'rotate-[0.8deg]', speed: 13 },
  { span: 'col-span-1 row-span-1', rotate: '-rotate-[1.5deg]', speed: 9 },
  { span: 'col-span-1 row-span-1', rotate: 'rotate-[1deg]', speed: 12 },
]

/**
 * Galería premium en composición editorial con parallax multi-velocidad
 * y lightbox fullscreen. Las fotografías se definen en la configuración.
 */
export function Gallery(): React.JSX.Element {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const images = invitation.gallerySection.images

  return (
    <section
      id="gallery"
      aria-label="Galería de momentos"
      className="grain relative overflow-hidden bg-gradient-to-b from-rose-deep via-rose-dark to-ink py-24 sm:py-36"
    >
      <FloralDecoration variant="corner" from="right" flipX width={170} drift={30} className="-right-10 top-16 opacity-60" />

      {/* aura dorada */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.18), transparent 65%)' }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-8">
        <SectionTitle
          eyebrow={invitation.gallerySection.eyebrow}
          title={invitation.gallerySection.heading}
          tone="dark"
        />

        <div className="mt-16 grid auto-rows-[34vw] grid-cols-2 gap-4 sm:auto-rows-[30vw] md:auto-rows-[240px] md:grid-cols-4 md:gap-6 lg:auto-rows-[280px]">
          {images.map((image, index) => {
            const layout = COLLAGE[index % COLLAGE.length]
            return (
              <button
                key={image.src + index}
                type="button"
                onClick={() => setLightboxIndex(index)}
                aria-label={`Ampliar fotografía ${(index + 1)}: ${image.alt}`}
                data-cursor-hover
                className={`group relative overflow-hidden rounded-xl shadow-[0_24px_50px_-16px_rgba(23,18,23,0.7)] ring-1 ring-white/10 transition-shadow duration-500 focus-visible:ring-gold ${layout.span} ${layout.rotate}`}
              >
                <ParallaxImage
                  src={image.src}
                  alt={image.alt}
                  speed={layout.speed}
                  reveal={false}
                  loading={index > 1 ? 'lazy' : 'eager'}
                  imgClassName="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.07]"
                  className="h-full w-full"
                />
                {/* velo + marco al hover */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-rose-dark/25 opacity-100 transition-opacity duration-500 group-hover:opacity-0"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-2 rounded-lg border border-gold/0 transition-all duration-500 group-hover:border-gold/70"
                />
              </button>
            )
          })}
        </div>

        <p className="mt-12 text-center font-display text-sm italic tracking-wide text-blush/60">
          Toca una fotografía para acercarte
        </p>
      </div>

      <Lightbox
        images={[...images]}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
      />
    </section>
  )
}
