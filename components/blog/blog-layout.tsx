import { MathStyles } from './math-styles'
import { DraftBanner } from './draft-banner'
import { TableOfContents } from './table-of-contents'

interface TocHeading {
  id: string
  text: string
  level: number
}

interface BlogLayoutProps {
  children: React.ReactNode
  toc?: TocHeading[]
  isDraft?: boolean
}

export function BlogLayout({
  children,
  toc,
  isDraft = false,
}: BlogLayoutProps) {
  return (
    <>
      <MathStyles />
      {isDraft && <DraftBanner />}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24">
        <div className="flex gap-12">
          <article className="flex-1 min-w-0 max-w-[65ch] mx-auto">
            {children}
          </article>
          {toc && toc.length > 0 && (
            <aside className="hidden lg:block w-56 flex-shrink-0">
              <TableOfContents headings={toc} />
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
