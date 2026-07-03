'use client'

import posthog from 'posthog-js'

interface PostTagsProps {
  tags: string[]
}

export function PostTags({ tags }: PostTagsProps) {
  if (tags.length === 0) return null

  return (
    <div className="mt-14 border-t border-[rgba(0,0,0,0.08)] pt-6">
      <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
        Tagged
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        {tags.map((tag) => (
          <a
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            className="rounded-full border border-[rgba(17,17,17,0.12)] bg-[rgba(255,255,255,0.72)] px-3.5 py-2 text-[12px] uppercase tracking-[0.08em] text-[#555] transition-colors hover:bg-white hover:text-[#111]"
            onClick={() => posthog.capture('blog_tag_clicked', { tag })}
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  )
}
