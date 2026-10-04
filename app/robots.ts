import type { MetadataRoute } from 'next'

const publicAllow = ['/', '/og', '/api/og']
const privateDisallow = [
  '/api/',
  '/model-service/',
  '/login',
  '/onboarding',
  '/delete-account',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'GPTBot',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'ChatGPT-User',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'ClaudeBot',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'anthropic-ai',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'PerplexityBot',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'Google-Extended',
        allow: publicAllow,
        disallow: privateDisallow,
      },
      {
        userAgent: 'CCBot',
        disallow: '/',
      },
    ],
    sitemap: 'https://beaglabs.com/sitemap.xml',
    host: 'https://beaglabs.com',
  }
}
