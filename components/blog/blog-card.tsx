import Link from 'next/link'
import type { BlogPost } from '@/lib/hygraph/types'

interface BlogCardProps {
  post: BlogPost
}

function normalizeTags(tags: string[]): string[] {
  return tags.flatMap((t) => {
    try {
      const parsed = JSON.parse(t)
      return Array.isArray(parsed) ? parsed : [t]
    } catch {
      return [t]
    }
  })
}

export function BlogCard({ post }: BlogCardProps) {
  const tags = normalizeTags(post.tags)
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="nb-card group overflow-hidden rounded-[24px]">
        {post.coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.coverImage.url}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
        )}
        <div className="p-6 lg:p-7">
          <span className="mb-4 inline-block rounded-full bg-[#f3ede5] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#ff5f1f] font-bold">
            {post.category}
          </span>
          <h3 className="mb-3 text-[24px] leading-[1.08] tracking-[-0.03em] text-[#111] transition-colors group-hover:text-[#ff5f1f]">
            {post.title}
          </h3>
          <p className="mb-4 line-clamp-3 text-[14px] leading-[1.75] text-[#555]">
            {post.exerpt}
          </p>
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#888]">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: '2-digit',
              })}
            </time>
            {tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{tags.slice(0, 2).join(' / ')}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
