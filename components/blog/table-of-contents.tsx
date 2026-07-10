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
    <nav className="sticky top-28 rounded-[24px] border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0px_0px_#111]">
      <span className="nb-label mb-4 inline-block">
        On this page
      </span>
      <ul className="mt-4 space-y-1.5 border-l-2 border-[#111]">
        {headings.map((heading) => (
          <li
            key={heading.id}
            style={{ paddingLeft: `${(heading.level - 2) * 12 + 12}px` }}
          >
            <a
              href={`#${heading.id}`}
              className={`-ml-[2px] block border-l-2 py-1 text-[12px] font-bold leading-[1.45] transition-colors ${
                activeId === heading.id
                  ? 'border-l-[#FF5F1F] text-[#111]'
                  : 'border-l-transparent text-[#555] hover:border-l-[#FF5F1F] hover:text-[#111]'
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
