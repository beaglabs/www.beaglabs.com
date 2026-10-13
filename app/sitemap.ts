import type { MetadataRoute } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_ALL_BLOG_SLUGS, GET_ALL_BLOG_CATEGORIES, GET_ALL_BLOG_TAGS } from '@/lib/hygraph/queries'

const BASE_URL = 'https://beaglabs.com'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: `${BASE_URL}/solutions/agentic-back-office`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/solutions/agentic-modernization-factory`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/claims`, changeFrequency: 'monthly', priority: 0.6 },
  { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/use-cases`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/compare`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/capabilities`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE_URL}/capability/modernization`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE_URL}/solutions/document-automation`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE_URL}/solutions/internal-app-factory`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE_URL}/solutions/agentic-modernization`, changeFrequency: 'monthly', priority: 0.85 },
  { url: `${BASE_URL}/products/papyrus`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/trust/papyrus`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/contact`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/partners`, changeFrequency: 'monthly', priority: 0.6 },
  { url: `${BASE_URL}/support`, changeFrequency: 'yearly', priority: 0.4 },
  { url: `${BASE_URL}/support/commercial`, changeFrequency: 'yearly', priority: 0.4 },
  { url: `${BASE_URL}/support/government`, changeFrequency: 'yearly', priority: 0.4 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let dynamicRoutes: MetadataRoute.Sitemap = []
  let dataRoutes: MetadataRoute.Sitemap = []

  // Hygraph content (blog posts, categories, tags)
  try {
    const [blogData, blogCats, blogTags] = await Promise.all([
      fetchHygraph<{ blogPosts: { slug: string; publishedAt: string }[] }>(GET_ALL_BLOG_SLUGS),
      fetchHygraph<{ blogPosts: { category: string }[] }>(GET_ALL_BLOG_CATEGORIES),
      fetchHygraph<{ blogPosts: { tags: string[] }[] }>(GET_ALL_BLOG_TAGS),
    ])

    const blogRoutes: MetadataRoute.Sitemap = blogData.blogPosts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    const categories = [...new Set(blogCats.blogPosts.map((p) => p.category))]
    const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
      url: `${BASE_URL}/blog/category/${encodeURIComponent(cat)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    const tags = [...new Set(blogTags.blogPosts.flatMap((p) => p.tags))]
    const tagRoutes: MetadataRoute.Sitemap = tags.map((tag) => ({
      url: `${BASE_URL}/blog/tag/${encodeURIComponent(tag)}`,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }))

    dynamicRoutes = [...blogRoutes, ...categoryRoutes, ...tagRoutes]
  } catch {
    // If Hygraph is unavailable, serve static routes only
  }

  // Back office use cases and comparisons

  try {
    const { industries } = await import('@/data/use-cases/industries')
    dataRoutes.push(...industries.map((i) => ({
      url: `${BASE_URL}/use-cases/${i.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })))
  } catch {}

  try {
    const { comparisons } = await import('@/data/comparisons/comparisons')
    const { guides, verifiedOnIso } = await import('@/lib/compare')
    const { platforms, profileSlug } = await import('@/lib/compare')
    dataRoutes.push(...platforms.map((platform) => ({
      url: `${BASE_URL}/products/${profileSlug(platform)}`,
      lastModified: new Date(verifiedOnIso),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })))
    dataRoutes.push(...guides.map((guide) => ({
      url: `${BASE_URL}/compare/${guide.slug}`,
      lastModified: new Date(verifiedOnIso),
      changeFrequency: 'monthly' as const,
      priority: guide.kind === 'guide' ? 0.8 : 0.7,
    })))
    dataRoutes.push(...comparisons.map((c) => ({
      url: `${BASE_URL}/compare/${c.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })))
  } catch {}

  const { claims } = await import('@/lib/claims')
  const claimRoutes = claims.map(claim => ({ url: `${BASE_URL}/claims/${claim.claimId}`, changeFrequency: 'monthly' as const, priority: 0.5 }))
  return [...staticRoutes, ...dynamicRoutes, ...dataRoutes, ...claimRoutes]
}
