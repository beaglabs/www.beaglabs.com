import type { MetadataRoute } from 'next'

// This is an isolated preview; only production pages should be indexed.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] }
}
