import Link from "next/link"

export function FinalCTASection() {
  return (
    <section className="bg-[#111] text-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-10 px-6 py-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-end lg:px-9 lg:py-28">
        <div>
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
            Start A Conversation
          </div>
          <h2 className="mb-4 max-w-[720px] text-[42px] font-bold leading-[0.98] tracking-[-0.055em] text-white lg:text-[54px]">
            Bring us the hard problem.
          </h2>
          <p className="max-w-[560px] text-[18px] leading-[1.72] text-[#C9C9C9]">
            Use the same premium calm from the hero, but with a sharper closing
            message and one clear conversion action.
          </p>
        </div>

        <div className="flex flex-wrap items-end justify-start gap-4 lg:justify-end">
          <a
            href="https://cal.com/comradelemoncake/meet-the-founder"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-[#FF7A1A] px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#111] transition-colors duration-200 hover:bg-[#ff8b39]"
          >
            Talk to us
          </a>
          <Link
            href="/research"
            className="inline-flex items-center justify-center rounded-full border border-[rgba(255,255,255,0.16)] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-[rgba(255,255,255,0.06)]"
          >
            See research
          </Link>
        </div>
      </div>
    </section>
  )
}
