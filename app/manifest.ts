import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beag Labs — Agentic Modernization',
    short_name: 'Beag Labs',
    description: 'Document automation, internal app development and legacy modernization using customer-hosted AI.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#fdeee1',
    theme_color: '#fdeee1',
    icons: [
      { src: '/web-app-manifest-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    ],
  }
}
