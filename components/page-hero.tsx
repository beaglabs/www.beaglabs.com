import type { ReactNode } from "react"
import { ArrowRight } from "lucide-react"
import { HeroBackdrop } from "@/components/hero-backdrop"
import { TrialCtaLink } from "@/components/trial-cta-link"

export type PageHeroProps = {
  label: string
  title: string
  description: ReactNode
  /** Primary button text; it always goes to papyrus.beaglabs.com. */
  cta?: string
  /** Breadcrumbs or a small link above the label. */
  above?: ReactNode
  /** Anything extra under the buttons (a date, a note). */
  below?: ReactNode
}

/** Every page's hero, matching the homepage: black, static dots, and the copy in a white card. */
export function PageHero({ label, title, description, cta = "Try Papyrus now", above, below }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#000000] text-[#111]">
      <HeroBackdrop />
      <div className="relative z-20 mx-auto flex max-w-[960px] flex-col items-center px-6 pb-20 pt-28 lg:pb-24 lg:pt-32">
        <div className="w-full border-[3px] border-[#111] bg-white px-6 py-10 text-center shadow-[10px_10px_0_#111] sm:px-12 sm:py-12">
          {above ? <div className="mb-5 flex justify-center text-left">{above}</div> : null}
          <span className="nb-label mb-6 inline-block !bg-[#ff5f1f]">{label}</span>
          <h1 className="display-black mb-6 text-[length:min(44px,9.2vw)] leading-[.95] [overflow-wrap:normal] sm:text-[56px] lg:text-[68px]">{title}</h1>
          <div className="mx-auto mb-6 h-[3px] w-full max-w-[420px] bg-[#111]" />
          <div className="mx-auto max-w-[640px] text-[16px] font-semibold leading-[1.65] text-[#333] sm:text-[18px]">{description}</div>
          <div className="mt-8 flex justify-center">
            <TrialCtaLink placement="page-hero" className="inline-flex h-[52px] items-center justify-center gap-2 border-[3px] border-[#111] bg-[#ff5f1f] px-6 text-[12px] font-black uppercase tracking-[.06em] text-[#111] shadow-[4px_4px_0_#111] transition hover:-translate-x-px hover:-translate-y-px hover:bg-[#ffdfcf] hover:shadow-[6px_6px_0_#111]">
              {cta} <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </TrialCtaLink>
          </div>
          {below ? <div className="mt-5">{below}</div> : null}
        </div>
      </div>
    </section>
  )
}
