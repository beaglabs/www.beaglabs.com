import Link from "next/link"
import { ArrowRight } from "lucide-react"

export function FinalCTASection() {
  return <section className="relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#fffaf3] text-[#1a1714]">
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <video className="h-full w-full object-cover opacity-70 motion-reduce:hidden" src="/hero/clip-3.mp4" poster="/hero/poster-3.jpg" autoPlay muted loop playsInline preload="metadata" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="hidden h-full w-full object-cover opacity-70 motion-reduce:block" src="/hero/poster-3.jpg" alt="" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#fffaf3] via-[#fffaf3]/85 to-[#fffaf3]/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#fffaf3]/70 via-transparent to-[#fffaf3]/80" />
      <div className="marketing-grid absolute inset-0" />
    </div>
    <div className="relative mx-auto flex max-w-[1440px] flex-col items-start gap-8 px-6 py-16 lg:flex-row lg:items-center lg:justify-between lg:px-9 lg:py-20">
      <div className="max-w-[790px]">
        <span className="mb-5 inline-block border-2 border-[#1a1714] bg-[#e5632f] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-wider">Next step</span>
        <h2 className="display-black text-[length:min(48px,9vw)] leading-[.95] sm:text-[64px]">Put your workflows to work.</h2>
        <p className="mt-6 max-w-[680px] text-base font-semibold leading-7 text-[#4a3d33]">Get the solution brief to see how we deliver document automation, internal apps, legacy modernization and back-office operations, or start with Papyrus commercial today.</p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-3">
        <a href="/#solution-brief" className="inline-flex items-center gap-3 border-[3px] border-[#1a1714] bg-[#e5632f] px-6 py-4 text-xs font-black uppercase tracking-wide shadow-[5px_5px_0_#1a1714] hover:bg-[#f7c995]">Request a solution brief <ArrowRight className="h-4 w-4" /></a>
        <Link href="/contact" className="text-xs font-bold underline underline-offset-4">Need a government or offline deployment?</Link>
      </div>
    </div>
  </section>
}
