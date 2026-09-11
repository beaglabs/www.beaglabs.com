import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POST, GET_ALL_BLOG_SLUGS } from '@/lib/hygraph/queries'
import type { BlogPostResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { BlocksRenderer } from '@/components/blog/blocks-renderer'
import { PostTracker } from '@/components/blog/post-tracker'
import { PostTags } from '@/components/blog/post-tags'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ogImageUrl } from '@/lib/seo'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const data = await fetchHygraph<{ blogPosts: { slug: string }[] }>(GET_ALL_BLOG_SLUGS)
    return data.blogPosts.map((post) => ({ slug: post.slug }))
  } catch {
    return []
  }
}

function extractHeadings(markdown: string) {
  const headingRegex = /^(#{2,3})\s+(.+)$/gm
  const headings: Array<{ id: string; text: string; level: number }> = []
  let match: RegExpExecArray | null

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2].trim()
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    headings.push({ id, text, level })
  }

  return headings
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<BlogPostResponse>(
    GET_BLOG_POST,
    { slug },
    isDraft
  )

  if (!data.blogPost) {
    return { title: 'Not Found' }
  }

  const canonicalUrl = `https://www.beaglabs.com/blog/${slug}`
  const ogUrl = ogImageUrl({
    title: data.blogPost.title,
    description: data.blogPost.seoDescription || data.blogPost.exerpt,
    label: data.blogPost.category,
    date: data.blogPost.publishedAt,
  })

  return {
    title: data.blogPost.seoTitle || data.blogPost.title,
    description: data.blogPost.seoDescription || data.blogPost.exerpt,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${data.blogPost.seoTitle || data.blogPost.title} — Beag Labs`,
      description: data.blogPost.seoDescription || data.blogPost.exerpt,
      siteName: 'Beag Labs',
      locale: 'en_US',
      type: 'article' as const,
      publishedTime: data.blogPost.publishedAt,
      modifiedTime: data.blogPost.updatedAt,
      url: canonicalUrl,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: data.blogPost.title }],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${data.blogPost.seoTitle || data.blogPost.title} — Beag Labs`,
      description: data.blogPost.seoDescription || data.blogPost.exerpt,
      images: [ogUrl],
    },
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<BlogPostResponse>(
    GET_BLOG_POST,
    { slug },
    isDraft
  )

  if (!data.blogPost) {
    notFound()
  }

  const post = data.blogPost
  const toc = extractHeadings(post.body)
  const canonicalUrl = `https://www.beaglabs.com/blog/${slug}`

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.exerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'Beag Labs',
      url: 'https://www.beaglabs.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Beag Labs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.beaglabs.com/favicon.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
    ...(post.coverImage
      ? {
          image: {
            '@type': 'ImageObject',
            url: post.coverImage.url,
            width: post.coverImage.width,
            height: post.coverImage.height,
          },
        }
      : {}),
    articleSection: post.category,
    keywords: post.tags.join(', '),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostTracker
        eventName="blog_post_viewed"
        properties={{ slug, title: post.title, category: post.category }}
      />

      {/* ─── HERO BAND ─── */}
      <section className="border-b-[3px] border-[#111] bg-[#ff5f1f]">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-8 px-6 py-14 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-16 lg:px-9 lg:py-16">
          <p className="font-mono text-[13px] font-bold uppercase tracking-[0.2em] text-[#111]">
            [{' '}
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </time>{' '}
            ]
          </p>
          <div className="max-w-[820px] lg:justify-self-end">
            <span className="mb-5 inline-block border-[2px] border-[#111] bg-[#111] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff5f1f]">
              {post.category}
            </span>
            <h1 className="text-[36px] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#111] sm:text-[46px] lg:text-[58px]">
              {post.title}
            </h1>
            <p className="mt-5 max-w-[720px] text-[18px] font-medium leading-[1.6] text-[#111]">
              {post.exerpt}
            </p>
          </div>
        </div>
      </section>

      <BlogLayout toc={toc} isDraft={isDraft}>
        <Breadcrumbs items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${slug}` },
        ]} />

      {post.coverImage && (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="mb-10 w-full rounded-[24px] border-[3px] border-[#111] shadow-[6px_6px_0px_0px_#111]"
        />
      )}

      <BlocksRenderer
        markdown={post.body}
        mathBlocks={post.mathBlock ?? []}
        mermaidBlocks={post.mermaidBlock ?? []}
        tableBlocks={post.tableBlock ?? []}
      />

      <PostTags tags={post.tags} />
      </BlogLayout>
    </>
  )
}
