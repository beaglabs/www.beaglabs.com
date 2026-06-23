'use client'

import posthog from 'posthog-js'

interface PostTagsProps {
  tags: string[]
}

export function PostTags({ tags }: PostTagsProps) {
  if (tags.length === 0) return null

  return (
    <div className="mt-12 pt-6 border-t border-[rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 flex-wrap">
        {tags.map((tag) => (
          <a
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            className="text-xs text-[#555] hover:text-[#111] bg-[#f5f5f5] hover:bg-[#eee] px-2.5 py-1 rounded-full transition-colors"
            onClick={() => posthog.capture('blog_tag_clicked', { tag })}
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  )
}
