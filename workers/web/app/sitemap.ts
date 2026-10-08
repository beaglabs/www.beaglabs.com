import type { MetadataRoute } from 'next'

// Keep the preview sitemap intentionally empty to avoid competing canonicals.
export default function sitemap(): MetadataRoute.Sitemap { return [] }
