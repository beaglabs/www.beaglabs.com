import Link from 'next/link'
import type { CSSProperties } from 'react'
import type { BlogPost } from '@/lib/hygraph/types'

interface BlogCardProps {
  post: BlogPost
  featured?: boolean
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

// Blacksmith-style dotted-grid placeholder for posts without a cover image.
const DOT_GRID: CSSProperties = {
  backgroundColor: '#f4f4f2',
  backgroundImage: 'radial-gradient(#c9c9c4 1.2px, transparent 1.2px)',
  backgroundSize: '16px 16px',
  backgroundPosition: '-1px -1px',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  })
}

function Thumbnail({
  post,
  className = '',
  chipSize = 'sm',
}: {
  post: BlogPost
  className?: string
  chipSize?: 'sm' | 'lg'
}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {post.coverImage ? (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="h-full w-full object-cover grayscale-[10%] transition-transform duration-500 group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center" style={DOT_GRID}>
          <span
            className={`border-[3px] border-[#111] bg-[#ff5f1f] font-mono font-extrabold uppercase tracking-[0.18em] text-[#111] shadow-[4px_4px_0px_0px_#111] ${
              chipSize === 'lg' ? 'px-5 py-2.5 text-[13px]' : 'px-4 py-2 text-[11px]'
            }`}
          >
            {post.category}
          </span>
        </div>
      )}
      <span className="absolute right-3 top-3 border-[2px] border-[#111] bg-white px-2 py-1 font-mono text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#111]">
        beaglabs / blog
      </span>
    </div>
  )
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  const tags = normalizeTags(post.tags)
  const date = formatDate(post.publishedAt)

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="md:col-span-2 lg:col-span-3">
        <article className="nb-card group grid grid-cols-1 overflow-hidden bg-white lg:grid-cols-[1.15fr_1fr]">
          <Thumbnail
            post={post}
            chipSize="lg"
            className="aspect-[16/10] border-b-[3px] border-[#111] lg:aspect-auto lg:border-b-0 lg:border-r-[3px]"
          />
          <div className="flex flex-col justify-center p-7 lg:p-10">
            <div className="mb-4 flex items-center gap-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#555]">
              <span className="text-[#ff5f1f]">{post.category}</span>
              <span aria-hidden="true">·</span>
              <time dateTime={post.publishedAt}>{date}</time>
            </div>
            <h2 className="mb-4 text-[30px] font-extrabold leading-[1.03] tracking-[-0.035em] text-[#111] transition-colors group-hover:text-[#ff5f1f] lg:text-[40px]">
              {post.title}
            </h2>
            <p className="line-clamp-3 max-w-[560px] text-[15px] leading-[1.7] text-[#555]">
              {post.exerpt}
            </p>
            <span className="mt-7 inline-flex items-center gap-1.5 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#111] transition-all group-hover:gap-3">
              Read the post
              <span aria-hidden="true">→</span>
            </span>
          </div>
        </article>
      </Link>
    )
  }

  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="nb-card group flex h-full flex-col overflow-hidden bg-white">
        <Thumbnail post={post} className="aspect-[4/3] border-b-[3px] border-[#111]" />
        <div className="flex flex-1 flex-col p-6">
          <div className="mb-3 flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[#555]">
            <span className="text-[#ff5f1f]">{post.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.publishedAt}>{date}</time>
          </div>
          <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.03em] text-[#111] transition-colors group-hover:text-[#ff5f1f]">
            {post.title}
          </h3>
          <p className="line-clamp-2 text-[14px] leading-[1.7] text-[#555]">
            {post.exerpt}
          </p>
          <div className="mt-auto flex items-center justify-between gap-3 pt-5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#111] transition-all group-hover:gap-2.5">
              Read
              <span aria-hidden="true">→</span>
            </span>
            {tags.length > 0 && (
              <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-[#999]">
                {tags.slice(0, 2).join(' / ')}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
