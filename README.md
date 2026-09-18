# Tania · Invitación Digital de XV Años

Experiencia cinematográfica, premium e interactiva para compartir por WhatsApp.
Construida como **plantilla reutilizable**: toda invitación se personaliza
editando **un solo archivo** — sin tocar componentes.

## Stack

React 19 · TypeScript estricto · Vite · Tailwind CSS v4 · GSAP + ScrollTrigger ·
Framer Motion · Three.js (React Three Fiber) · Lenis · Lucide · PWA

## Backend (confirmación por WhatsApp)

El proyecto incluye un backend Express + Baileys en `server/` que registra las
confirmaciones en MongoDB y envía el WhatsApp de confirmación.

### Nota sobre entrega de mensajes (México + antispam)

- **Formato**: para celulares de México, WhatsApp exige el `1` después del `52`
  en el número de destino (ej. `2221234567` → `5212221234567`). El server lo
  aplica automáticamente (`MOBILE_PREFIX` en el entorno, default `1`).
- **Entrega real ≠ "enviado"**: Baileys marca el envío apenas escribe al socket.
  El server escucha `messages.update` y registra el estado real:
  `enviado` → `entregado-servidor` (ACK del servidor) → `entregado` (llegó al
  teléfono) / `error`, y un watchdog marca `no-entregado` si una confirmación
  lleva > 90 s en "Esperando el mensaje" (el número invitado puede no tener
  WhatsApp, estar apagado o estar bloqueado). Ver panel `/admin` y logs de Render.
- **Entrega al instante**: si en la app de WhatsApp la línea vinculada muestra
  "Esperando el mensaje" y nunca entrega, el problema no es el código: el
  teléfono vinculado debe estar **en línea** y el número del invitado debe
  existir en WhatsApp. Guárdalo como contacto o escríbele una vez desde la
  línea vinculada para evitar que WhatsApp lo ponga en cola (antispam).
- **Prueba**: usa el campo "Probar envío de WhatsApp" del panel `/admin` y
  revisa en Render: `[whatsapp] enviando → 5212221234567@s.whatsapp.net` y
  luego `entregado ✓`.

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
