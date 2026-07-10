import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/model-service/',
          '/login',
          '/onboarding',
          '/delete-account',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
        disallow: ['/api/', '/model-service/', '/login', '/onboarding', '/delete-account'],
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
        disallow: ['/api/', '/model-service/', '/login', '/onboarding', '/delete-account'],
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
        disallow: ['/api/', '/model-service/', '/login', '/onboarding', '/delete-account'],
      },
      {
        userAgent: 'anthropic-ai',
        allow: '/',
        disallow: ['/api/', '/model-service/', '/login', '/onboarding', '/delete-account'],
      },
      {
        userAgent: 'PerplexityBot',
        allow: '/',
        disallow: ['/api/', '/model-service/', '/login', '/onboarding', '/delete-account'],
      },
      {
        userAgent: 'Google-Extended',
        allow: '/',
        disallow: ['/api/', '/model-service/', '/login', '/onboarding', '/delete-account'],
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
