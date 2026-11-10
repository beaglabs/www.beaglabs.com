import { SiteFooter } from '@/components/site-footer'

interface LegalPageShellProps {
  eyebrow: string
  title: string
  updatedAt: string
  intro: string
  children: React.ReactNode
}

export function LegalPageShell({
  eyebrow,
  title,
  updatedAt,
  intro,
  children,
}: LegalPageShellProps) {
  return (
    <main className="bg-[#FDEEE1] text-[#1a1714]">

      <section className="px-6 py-14 lg:px-9 lg:py-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="site-hero px-6 mb-14 border-b-[3px] border-[#1a1714] pb-10">
            <span className="nb-label mb-5 inline-block">
              {eyebrow}
            </span>
            <h1 className="mb-3 text-[length:min(42px,9vw)] font-extrabold tracking-[-0.05em] text-[#1a1714] lg:text-[54px]">
              {title}
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#5b4a3d]">
              Last updated: {updatedAt}
            </p>
          </div>

          <div className="mx-auto max-w-[920px]">
            <div className="nb-card bg-[#fffaf3] p-8 sm:p-10">
              <p className="mb-8 text-[17px] leading-[1.72] text-[#4a3d33] font-medium">
                {intro}
              </p>
              <div className="space-y-8 [&_h2]:mb-3 [&_h2]:text-[26px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.04em] [&_h2]:text-[#1a1714] [&_p]:text-[16px] [&_p]:leading-[1.82] [&_p]:text-[#4a3d33] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-[#4a3d33] [&_strong]:text-[#1a1714]">
                {children}
              </div>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
