import Link from 'next/link'
import type { BlogPost } from '@/lib/hygraph/types'

interface BlogCardProps {
  post: BlogPost
}

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link href={`/blog/${post.slug}`}>
      <article className="group bg-white rounded-lg border border-[rgba(0,0,0,0.06)] border-l-[3px] border-l-[#8B7355] overflow-hidden hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {post.coverImage && (
          <div className="aspect-video overflow-hidden">
            <img
              src={post.coverImage.url}
              alt={post.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-6">
          <span className="inline-block text-xs font-medium text-[#8B7355] bg-[#8B7355]/10 px-2 py-0.5 rounded-full mb-3">
            {post.category}
          </span>
          <h3 className="text-lg font-bold tracking-[-0.02em] text-[#111] mb-2 group-hover:text-[#8B7355] transition-colors">
            {post.title}
          </h3>
          <p className="text-sm text-[#555] line-clamp-2 mb-3 leading-relaxed">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-3 text-xs text-[#999]">
            <time dateTime={post.publishedAt}>
              {new Date(post.publishedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {post.tags.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="truncate">{post.tags.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
