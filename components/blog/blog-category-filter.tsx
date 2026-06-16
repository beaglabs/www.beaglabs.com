import Link from 'next/link'

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
    <div className="flex items-center gap-2 flex-wrap mb-8">
      {CATEGORIES.map((cat) => {
        const isActive = cat.value === (currentCategory || '')
        const href = cat.value
          ? `/blog/category/${encodeURIComponent(cat.value)}`
          : '/blog'

        return (
          <Link
            key={cat.value}
            href={href}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              isActive
                ? 'bg-[#111] text-white'
                : 'text-[#555] hover:text-[#111] bg-[#f5f5f5] hover:bg-[#eee]'
            }`}
          >
            {cat.label}
          </Link>
        )
      })}
    </div>
  )
}
