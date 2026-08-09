import type { MetadataRoute } from 'next'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_ALL_BLOG_SLUGS, GET_ALL_BLOG_CATEGORIES, GET_ALL_BLOG_TAGS } from '@/lib/hygraph/queries'

const BASE_URL = 'https://www.beaglabs.com'

const staticRoutes: MetadataRoute.Sitemap = [
  { url: BASE_URL, changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE_URL}/models`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/blog`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/research`, changeFrequency: 'weekly', priority: 0.8 },
  { url: `${BASE_URL}/glossary`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/use-cases`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/compare`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/cookbook`, changeFrequency: 'monthly', priority: 0.7 },
  { url: `${BASE_URL}/products/papyrus`, changeFrequency: 'monthly', priority: 0.9 },
  { url: `${BASE_URL}/trust/papyrus`, changeFrequency: 'monthly', priority: 0.8 },
  { url: `${BASE_URL}/design-partnerships`, changeFrequency: 'monthly', priority: 0.6 },
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

  // Static data files (glossary, use-cases, models, comparisons)
  try {
    const { glossaryTerms } = await import('@/data/glossary/terms')
    dataRoutes.push(...glossaryTerms.map((t) => ({
      url: `${BASE_URL}/glossary/${t.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })))
  } catch {}

  try {
    const { industries } = await import('@/data/use-cases/industries')
    dataRoutes.push(...industries.map((i) => ({
      url: `${BASE_URL}/use-cases/${i.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })))
  } catch {}

  try {
    const { modelFamilies } = await import('@/data/models/models')
    dataRoutes.push(...modelFamilies.map((m) => ({
      url: `${BASE_URL}/models/${m.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })))
  } catch {}

  try {
    const { comparisons } = await import('@/data/comparisons/comparisons')
    dataRoutes.push(...comparisons.map((c) => ({
      url: `${BASE_URL}/compare/${c.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })))
  } catch {}

  try {
    const { trainingConcepts } = await import('@/data/training/concepts')
    dataRoutes.push(...trainingConcepts.map((t) => ({
      url: `${BASE_URL}/training/${t.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })))
  } catch {}

  return [...staticRoutes, ...dynamicRoutes, ...dataRoutes]
}
