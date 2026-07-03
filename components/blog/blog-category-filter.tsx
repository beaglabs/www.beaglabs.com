'use client'

import Link from 'next/link'
import posthog from 'posthog-js'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'Case Study', label: 'Case Studies' },
  { value: 'Project Update', label: 'Project Updates' },
  { value: 'Tutorial', label: 'Tutorials' },
  { value: 'Opinion', label: 'Opinion' },
] as const

interface BlogCategoryFilterProps {
  currentCategory?: string
}

export function BlogCategoryFilter({
  currentCategory,
}: BlogCategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {CATEGORIES.map((cat) => {
        const isActive = cat.value === (currentCategory || '')
        const href = cat.value
          ? `/blog/category/${encodeURIComponent(cat.value)}`
          : '/blog'

        return (
          <Link
            key={cat.value}
            href={href}
            className={`rounded-full px-4 py-2 text-[12px] uppercase tracking-[0.08em] transition-colors ${
              isActive
                ? 'bg-[#111] text-white'
                : 'border border-[rgba(17,17,17,0.12)] bg-[rgba(255,255,255,0.72)] text-[#555] hover:bg-white hover:text-[#111]'
            }`}
            onClick={() => posthog.capture('blog_category_filtered', { category: cat.label })}
          >
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}
