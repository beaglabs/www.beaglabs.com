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
    <main className="bg-[#f6f4ef] text-[#111]">
      <Navbar />
      <section className="px-6 py-14 lg:px-9 lg:py-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-14 grid grid-cols-1 gap-8 border-b border-[rgba(0,0,0,0.08)] pb-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
            <div>
              <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
                {eyebrow}
              </div>
              <h1 className="mb-3 text-[42px] font-bold tracking-[-0.05em] text-[#111] lg:text-[54px]">
                {title}
              </h1>
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-[#8a8a8a]">
                Last updated: {updatedAt}
              </p>
            </div>
            <p className="max-w-[520px] text-[17px] leading-[1.72] text-[#4e4e4e] lg:justify-self-end">
              {intro}
            </p>
          </div>

          <div className="mx-auto max-w-[920px] rounded-[28px] border border-[rgba(17,17,17,0.08)] bg-[rgba(255,255,255,0.72)] px-6 py-8 backdrop-blur-sm sm:px-8 lg:px-10 lg:py-10">
            <div className="space-y-8 [&_h2]:mb-4 [&_h2]:text-[26px] [&_h2]:font-bold [&_h2]:tracking-[-0.04em] [&_h2]:text-[#111] [&_p]:text-[16px] [&_p]:leading-[1.82] [&_p]:text-[#555] [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ul]:text-[#555] [&_strong]:text-[#111]">
              {children}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </main>
  )
}
