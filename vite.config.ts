import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-cover.png'],
      manifest: {
        name: 'Tania | Mis XV Años',
        short_name: 'Tania XV',
        description:
          'Una noche para recordar. Te invito a celebrar mis XV años.',
        lang: 'es',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#171217',
        theme_color: '#FFF5FA',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/pwa-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id: string): string | undefined {
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor'
          }
          if (/[\\/]node_modules[\\/]framer-motion[\\/]/.test(id)) {
            return 'motion-vendor'
          }
          if (/[\\/]node_modules[\\/]gsap[\\/]/.test(id)) {
            return 'gsap-vendor'
          }
          if (/[\\/]node_modules[\\/](three|@react-three)[\\/]/.test(id)) {
            return 'three-vendor'
          }
          if (/[\\/]node_modules[\\/](lucide-react|lenis)[\\/]/.test(id)) {
            return 'ui-vendor'
          }
          return undefined
        },
      },
    },
  },
})
