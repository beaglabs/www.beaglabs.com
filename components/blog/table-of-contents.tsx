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
    <nav className="sticky top-28 rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.72)] p-5 backdrop-blur-sm">
      <h4 className="mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
        On this page
      </h4>
      <ul className="space-y-1.5 border-l border-[rgba(0,0,0,0.08)]">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12 + 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`-ml-[1px] block border-l-2 py-0.5 text-[12px] leading-[1.45] transition-colors ${
                activeId === heading.id
                  ? 'border-l-[#C7661D] font-medium text-[#111]'
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
