'use client'

import posthog from 'posthog-js'

interface PostTagsProps {
  tags: string[]
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

export function PostTags({ tags }: PostTagsProps) {
  const normalized = normalizeTags(tags)
  if (normalized.length === 0) return null

  return (
    <div className="mt-14 border-t-[3px] border-[#111] pt-6">
      <span className="nb-label mb-4 inline-block">
        Tagged
      </span>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        {normalized.map((tag) => (
          <a
            key={tag}
            href={`/blog/tag/${encodeURIComponent(tag)}`}
            className="nb-chip transition-all hover:-translate-y-0.5"
            onClick={() => posthog.capture('blog_tag_clicked', { tag })}
          >
            {tag}
          </a>
        ))}
      </div>
    </div>
  )
}
