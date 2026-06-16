'use client'

import { useEffect, useState } from 'react'

interface TocHeading {
  id: string
  text: string
  level: number
}

interface TableOfContentsProps {
  headings: TocHeading[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -80% 0px' }
    )

    for (const heading of headings) {
      const el = document.getElementById(heading.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  return (
    <nav className="sticky top-24">
      <h4 className="text-xs font-semibold text-[#999] uppercase tracking-wider mb-3">
        On this page
      </h4>
      <ul className="space-y-1.5 border-l border-[rgba(0,0,0,0.06)]">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12 + 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`block text-xs py-0.5 border-l-2 -ml-[1px] transition-colors ${
                activeId === heading.id
                  ? 'border-l-[#8B7355] text-[#111] font-medium'
                  : 'border-l-transparent text-[#555] hover:text-[#111]'
              }`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
