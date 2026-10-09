import Link from "next/link"
import { TrialCtaLink } from "@/components/trial-cta-link"
import { ArrowRight } from "lucide-react"

export function FinalCTASection() {
  return <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-white text-[#111]">
    <div aria-hidden="true" className="marketing-grid pointer-events-none absolute inset-0" />
    <div className="relative mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-9 lg:py-20">
      <div className="max-w-[790px]">
        <span className="mb-5 inline-block border-2 border-[#111] bg-[#ff5f1f] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider">Get started with Papyrus</span>
        <h2 className="display-black text-[48px] leading-[.95] sm:text-[64px]">Put your workflows to work.</h2>
        <p className="mt-6 max-w-[680px] text-base font-semibold leading-7 text-[#444]">Start a one-month trial in your Azure environment. Explore document automation, internal apps, and modernization with your team.</p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3">
        <TrialCtaLink placement="final" className="inline-flex items-center gap-3 border-[3px] border-[#111] bg-[#ff5f1f] px-6 py-4 text-xs font-black uppercase tracking-wide shadow-[5px_5px_0_#111] hover:bg-[#ffdfcf]">Start a one-month trial <ArrowRight className="h-4 w-4" /></TrialCtaLink>
        <Link href="/contact" className="text-xs font-bold underline underline-offset-4">Need a government or offline deployment?</Link>
      </div>
    </div>
  </section>
}
