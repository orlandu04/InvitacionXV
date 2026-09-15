# Tania · Invitación Digital de XV Años

Experiencia cinematográfica, premium e interactiva para compartir por WhatsApp.
Construida como **plantilla reutilizable**: toda invitación se personaliza
editando **un solo archivo** — sin tocar componentes.

## Stack

React 19 · TypeScript estricto · Vite · Tailwind CSS v4 · GSAP + ScrollTrigger ·
Framer Motion · Three.js (React Three Fiber) · Lenis · Lucide · PWA

## Desarrollo

```bash
npm install
npm run dev       # servidor local
npm run build     # producción (dist/)
npm run preview   # previsualizar build
npm run lint      # oxlint
```

## Personalización (todo en un lugar)

### 1. Datos del evento → `src/config/invitation.ts`

| Campo | Descripción |
| --- | --- |
| `name` / `initials` | Nombre de la quinceañera y monograma |
| `eventDate` | Fecha ISO `"2027-05-15T20:00:00"` — alimenta countdown y evento |
| `story.chapters` | Fotos y textos narrativos |
| `gallerySection.images` | Array de fotos de la galería (`src`, `alt`, `ratio`) |
| `event.details` / `location` | Fecha, hora, lugar, dirección |
| `location.mapsUrl` | Enlace de Google Maps |
| `dressCode` | Código de vestimenta + paleta sugerida |
| `finale` / `rsvpDeadline` | Textos finales |

### 2. WhatsApp → `src/config/social.ts`

- `whatsapp`: número en formato internacional sin `+` ni espacios (ej. `5215512345678`)
- `rsvpMessage`: mensaje preparado al confirmar asistencia

### 3. Fotografías

Reemplaza los SVG placeholder en `src/assets/images/` (mismos nombres) o cambia
las rutas en la parte superior de `invitation.ts`. Formatos ideales: **WebP/AVIF**
con JPG de respaldo, retrato ≥ 1200 px para el hero.

### 4. Música

Suelta tu archivo en `public/audio/theme.mp3` (ver nota dentro de la carpeta).
Si no existe, suena un **sintetizador ambiental generativo** como respaldo.

### 5. Colores → `src/index.css` (bloque `@theme`) y `src/config/theme.ts`

### 6. Al desplegar

Actualiza el dominio placeholder en las etiquetas Open Graph de `index.html`
(`og:image`, `twitter:image`) para que WhatsApp muestre la vista previa
con `public/og-cover.png`.

## Arquitectura

```
src/
├── animations/    # fadeUp, revealImage, parallax, cortinas… (reutilizables)
├── assets/        # imágenes y florales (SVG placeholders editables)
├── components/
│   ├── effects/   # Particles (Three.js lazy), Petals, Curtain, Cursor…
│   ├── gallery/   # Lightbox accesible
│   ├── layout/    # MusicPlayer, ErrorBoundary
│   └── ui/        # GlowButton, SectionTitle, ParallaxImage…
├── config/        # ⭐ invitation.ts · social.ts · theme.ts
├── context/       # estado global mínimo (apertura + audio)
├── hooks/         # useLenis, useAudio, useCountdown, usePerformance…
├── sections/      # Intro → Hero → Story → Gallery → Countdown → Event
│                  # → DressCode → Location → RSVP → Finale
└── utils/
```

## Rendimiento y accesibilidad

- Three.js se descarga **solo después** de abrir la invitación (code-split)
- Niveles automáticos HIGH/MEDIUM/LOW: partículas, blur y efectos según equipo
- `prefers-reduced-motion` respetado en toda la experiencia
- Lighthouse-friendly: fuentes con `display=swap`, imágenes lazy, chunks divididos
- Lightbox con navegación por teclado, foco gestionado y gestos táctiles

## Backend futuro (preparado, no incluido)

La arquitectura permite agregar luego `POST /api/rsvp`, panel `/admin`,
PostgreSQL, etc. Sustituyendo el enlace `wa.me` de `Rsvp.tsx` por un fetch.
