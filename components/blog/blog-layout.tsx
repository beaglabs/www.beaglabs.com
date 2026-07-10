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
      <div className="px-6 py-14 lg:px-9 lg:py-16">
        <div className="mx-auto flex max-w-[1440px] gap-10 xl:gap-14">
          <article className="min-w-0 max-w-[840px] flex-1 rounded-[28px] border-[3px] border-[#111] bg-white px-6 py-8 shadow-[6px_6px_0px_0px_#111] sm:px-8 lg:px-10 lg:py-10">
            {children}
          </article>
          {toc && toc.length > 0 && (
            <aside className="hidden w-64 flex-shrink-0 xl:block">
              <TableOfContents headings={toc} />
            </aside>
          )}
        </div>
      </div>
    </>
  )
}
