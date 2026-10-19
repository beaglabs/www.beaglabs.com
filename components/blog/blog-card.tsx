import Link from 'next/link'
import { ogImageUrl } from '@/lib/seo'
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

}: {
  post: BlogPost
  className?: string

}) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        src={ogImageUrl({ title:post.title, description:post.exerpt, label:post.category, date:post.publishedAt })}
        alt={`Branded cover: ${post.title}`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
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
