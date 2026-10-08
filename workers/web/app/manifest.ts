import type { MetadataRoute } from 'next'
export default function manifest(): MetadataRoute.Manifest {
 return { name: 'Beag Labs', short_name: 'Beag Labs', start_url: '/', display: 'browser', background_color: '#ffffff', theme_color: '#ff5f1f', icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }] }
}
