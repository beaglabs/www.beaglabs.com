'use client'

import Link from 'next/link'
import posthog from 'posthog-js'
import { BLOG_CATEGORIES } from '@/lib/blog/categories'

// `value` carries the Hygraph enum apiId so the /blog/category/[category] route
// receives a value the Content API can filter on. `label` is display-only.
const CATEGORIES = [{ value: '', label: 'All' }, ...BLOG_CATEGORIES] as const

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
            className={`rounded-full px-4 py-2 text-[12px] font-bold uppercase tracking-[0.08em] transition-all ${
              isActive
                ? 'border-[3px] border-[#111] bg-[#ff5f1f] text-[#111] shadow-[3px_3px_0px_0px_#111]'
                : 'border-[3px] border-[#111] bg-white text-[#555] shadow-[3px_3px_0px_0px_#111] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:shadow-[5px_5px_0px_0px_#111]'
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
