import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // The service worker was mangling range requests for the archive video (and
      // likely the piano's audio samples), breaking media for every visitor, and
      // its stale cache kept serving old builds. Offline caching adds nothing to a
      // heavy, network-driven WebGL site, so ship a self-destroying SW: it
      // unregisters any previously-installed worker and clears its caches for all
      // existing visitors, then goes away.
      selfDestroying: true,
      registerType: 'autoUpdate',
      workbox: {
        navigateFallbackDenylist: [/^\/archive/],
      },
      manifest: {
        name: 'Alex Taves',
        short_name: 'Alex Taves',
        description: 'Creative Director. Artist. Web Developer.',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
