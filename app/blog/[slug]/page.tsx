import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { fetchHygraph } from '@/lib/hygraph/client'
import { GET_BLOG_POST } from '@/lib/hygraph/queries'
import type { BlogPostResponse } from '@/lib/hygraph/types'
import { BlogLayout } from '@/components/blog/blog-layout'
import { MarkdownRenderer } from '@/components/blog/markdown-renderer'

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

  return {
    title: data.blogPost.seoTitle || data.blogPost.title,
    description: data.blogPost.seoDescription || data.blogPost.excerpt,
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

  return (
    <BlogLayout toc={toc} isDraft={isDraft}>
      <header className="mb-8">
        <p className="text-xs text-[#999] mb-3">
          <time dateTime={post.publishedAt}>
            {new Date(post.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <span aria-hidden="true"> · </span>
          <span>{post.category}</span>
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#111] mb-4">
          {post.title}
        </h1>
        <p className="text-base text-[#555] leading-relaxed">{post.excerpt}</p>
      </header>

      {post.coverImage && (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="w-full rounded-lg mb-10"
        />
      )}

      <MarkdownRenderer>{post.body}</MarkdownRenderer>

      {post.tags.length > 0 && (
        <div className="mt-12 pt-6 border-t border-[rgba(0,0,0,0.06)]">
          <div className="flex items-center gap-2 flex-wrap">
            {post.tags.map((tag) => (
              <a
                key={tag}
                href={`/blog/tag/${encodeURIComponent(tag)}`}
                className="text-xs text-[#555] hover:text-[#111] bg-[#f5f5f5] hover:bg-[#eee] px-2.5 py-1 rounded-full transition-colors"
              >
                {tag}
              </a>
            ))}
          </div>
        </div>
      )}
    </BlogLayout>
  )
}
