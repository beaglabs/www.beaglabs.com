import { isBackofficePost } from '@/lib/blog/backoffice-content'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POST, GET_ALL_BLOG_SLUGS } from '@/lib/hygraph/queries'
import type { BlogPostResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { BlocksRenderer } from '@/components/blog/blocks-renderer'
import { PostTracker } from '@/components/blog/post-tracker'
import { PostTags } from '@/components/blog/post-tags'
import { PostCtaSocial } from '@/components/blog/post-cta-social'
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

function formatPostDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params
  if (!isBackofficePost(slug)) notFound()
  const { isEnabled: isDraft } = await draftMode()

  const data = await fetchHygraph<BlogPostResponse>(
    GET_BLOG_POST,
    { slug },
    isDraft
  )

  if (!data.blogPost) {
    return { title: 'Not Found' }
  }

  const canonicalUrl = `https://beaglabs.com/blog/${slug}`
  const ogUrl = ogImageUrl({
    title: data.blogPost.title,
    description: data.blogPost.seoDescription || data.blogPost.exerpt,
    label: data.blogPost.category,
    date: data.blogPost.publishedAt,
    coverImage: data.blogPost.coverImage?.url,
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
      images: [
        { url: ogUrl, width: 1200, height: 630, alt: data.blogPost.title, type: 'image/png' },
      ],
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
  if (!isBackofficePost(slug)) notFound()
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
  const canonicalUrl = `https://beaglabs.com/blog/${slug}`
  const formattedDate = formatPostDate(post.publishedAt)

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
      url: 'https://beaglabs.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Beag Labs',
      logo: {
        '@type': 'ImageObject',
        url: 'https://beaglabs.com/favicon.png',
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

      <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#111] px-5 py-14" style={{backgroundImage:'radial-gradient(circle at center, #ff5f1f 0 6px, transparent 6.5px), radial-gradient(circle at center, #ffc9b0 0 6px, transparent 6.5px), radial-gradient(circle at center, #fff 0 6px, transparent 6.5px)',backgroundSize:'54px 18px, 54px 18px, 54px 18px',backgroundPosition:'0 0,18px 0,36px 0'}}>
        <div className="relative mx-auto flex max-w-[1050px] flex-col items-center border-[4px] border-[#111] bg-white px-6 py-12 text-center shadow-[10px_10px_0_#111] sm:px-12">
          <span className="border-2 border-[#111] bg-[#ff5f1f] px-4 py-2 font-mono text-[11px] font-black uppercase tracking-[.15em] shadow-[3px_3px_0_#111]">{post.category}</span>
          <h1 className="mt-8 max-w-[960px] font-[family-name:var(--font-roboto-condensed)] text-[length:min(64px,9vw)] font-black uppercase leading-[.97] tracking-[-.04em]">{post.title}</h1>
          <div className="mt-8 h-[3px] w-full max-w-[460px] bg-[#111]" />
          <p className="mt-7 max-w-[740px] text-lg font-bold leading-8 text-[#333]">{post.exerpt}</p>
          <time dateTime={post.publishedAt} className="mt-8 border-b-2 border-[#111] pb-1 font-mono text-xs font-black uppercase tracking-wider">{formattedDate} · Beag Labs</time>
        </div>
      </section>

      <BlogLayout toc={toc} isDraft={isDraft}>
        <Breadcrumbs items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: post.title, url: `/blog/${slug}` },
        ]} />

        <BlocksRenderer
          markdown={post.body}
          mathBlocks={post.mathBlock ?? []}
          mermaidBlocks={post.mermaidBlock ?? []}
          tableBlocks={post.tableBlock ?? []}
        />

        <PostTags tags={post.tags} />
        <PostCtaSocial title={post.title} url={canonicalUrl} />
      </BlogLayout>
    </>
  )
}
