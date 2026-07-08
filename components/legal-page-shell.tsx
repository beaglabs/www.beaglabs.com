import { Navbar } from '@/components/navbar'
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
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />
      <section className="px-6 py-14 lg:px-9 lg:py-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 border-b-[3px] border-[#111] pb-10">
            <span className="nb-label mb-5 inline-block">
              {eyebrow}
            </span>
            <h1 className="mb-3 text-[42px] font-extrabold tracking-[-0.05em] text-[#111] lg:text-[54px]">
              {title}
            </h1>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#555]">
              Last updated: {updatedAt}
            </p>
          </div>

          <div className="mx-auto max-w-[920px]">
            <div className="nb-card bg-white p-8 sm:p-10">
              <p className="mb-8 text-[17px] leading-[1.72] text-[#404040] font-medium">
                {intro}
              </p>
              <div className="space-y-8 [&_h2]:mb-3 [&_h2]:text-[26px] [&_h2]:font-extrabold [&_h2]:tracking-[-0.04em] [&_h2]:text-[#111] [&_p]:text-[16px] [&_p]:leading-[1.82] [&_p]:text-[#404040] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-[#404040] [&_strong]:text-[#111]">
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
