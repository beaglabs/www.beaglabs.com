import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Beag Labs — Agentic Modernization',
    short_name: 'Beag Labs',
    description: 'Document automation, internal app development and legacy modernization using customer-hosted AI.',
    start_url: '/',
    scope: '/',
    display: 'browser',
    background_color: '#FAFAF9',
    theme_color: '#ff5f1f',
    icons: [
      { src: '/favicon-demo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/web-app-manifest-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    ],
  }
}
