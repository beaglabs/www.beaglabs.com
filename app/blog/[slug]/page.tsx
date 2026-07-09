import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POST } from '@/lib/hygraph/queries'
import type { BlogPostResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { MarkdownRenderer } from '@/components/blog/markdown-renderer'
import { BlocksRenderer } from '@/components/blog/blocks-renderer'
import { PostTracker } from '@/components/blog/post-tracker'
import { PostTags } from '@/components/blog/post-tags'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
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

  const ogImage = data.blogPost.coverImage?.url

  return {
    title: data.blogPost.seoTitle || data.blogPost.title,
    description: data.blogPost.seoDescription || data.blogPost.exerpt,
    openGraph: {
      title: `${data.blogPost.seoTitle || data.blogPost.title} — Beag Labs`,
      description: data.blogPost.seoDescription || data.blogPost.exerpt,
      type: 'article' as const,
      publishedTime: data.blogPost.publishedAt,
      images: ogImage
        ? [{ url: ogImage, width: data.blogPost.coverImage!.width, height: data.blogPost.coverImage!.height }]
        : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: `${data.blogPost.seoTitle || data.blogPost.title} — Beag Labs`,
      description: data.blogPost.seoDescription || data.blogPost.exerpt,
      images: ogImage ? [ogImage] : [],
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
  const toc = extractHeadings(post.body.markdown)

  return (
    <BlogLayout toc={toc} isDraft={isDraft}>
      <PostTracker
        eventName="blog_post_viewed"
        properties={{ slug, title: post.title, category: post.category }}
      />
      <header className="mb-10 border-b border-[rgba(0,0,0,0.08)] pb-8">
        <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[#C7661D]">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })}
          </time>
          <span aria-hidden="true"> · </span>
          <span>{post.category}</span>
        </p>
        <h1 className="mb-4 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
          {post.title}
        </h1>
        <p className="max-w-[680px] text-[18px] leading-[1.75] text-[#555]">
          {post.exerpt}
        </p>
      </header>

      {post.coverImage && (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="mb-10 w-full rounded-[24px] border border-[rgba(17,17,17,0.08)]"
        />
      )}

      <BlocksRenderer
        markdown={post.body.markdown}
        mathBlocks={post.mathBlock ?? []}
        mermaidBlocks={post.mermaidBlock ?? []}
        tableBlocks={post.tableBlock ?? []}
      />

      <PostTags tags={post.tags} />
    </BlogLayout>
  )
}
