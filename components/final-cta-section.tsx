import { TrialCtaLink } from "@/components/trial-cta-link"
import { ArrowRight } from "lucide-react"

export function FinalCTASection() {
  return <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#ffffff] text-[#111]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <video className="h-full w-full object-cover opacity-70 motion-reduce:hidden" src="/hero/clip-3.mp4" poster="/hero/poster-3.jpg" autoPlay muted loop playsInline preload="metadata" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hidden h-full w-full object-cover opacity-70 motion-reduce:block" src="/hero/poster-3.jpg" alt="" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#ffffff] via-[#ffffff]/85 to-[#ffffff]/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffffff]/70 via-transparent to-[#ffffff]/80" />
      <div className="marketing-grid absolute inset-0" />
    </div>
    <div className="relative mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-9 lg:py-20">
      <div className="max-w-[790px]">
        <span className="mb-5 inline-block border-2 border-[#111] bg-[#ff5f1f] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider">Try Papyrus now</span>
        <h2 className="display-black text-[length:min(48px,9vw)] leading-[.95] sm:text-[64px]">Run your business on an agentic ERP.</h2>
        <p className="mt-6 max-w-[680px] text-base font-semibold leading-7 text-[#444]">Sign up at papyrus.beaglabs.com and Papyrus goes live at your own address in minutes. Bring your vendors, customers and invoices; the agents take it from there.</p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3">
        <TrialCtaLink placement="final" className="inline-flex items-center gap-3 border-[3px] border-[#111] bg-[#ff5f1f] px-6 py-4 text-xs font-black uppercase tracking-wide shadow-[5px_5px_0_#111] hover:bg-[#ffdfcf]">Try Papyrus now <ArrowRight className="h-4 w-4" /></TrialCtaLink>
        <span className="font-mono text-[10px] font-bold uppercase tracking-wide text-[#444]">papyrus.beaglabs.com</span>
      </div>
    </div>
  </section>
}
