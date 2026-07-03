import Link from "next/link"

const heroChips = [
  "Synthetic Data",
  "Forward Deployed ML",
  "Evaluation Systems",
]

export function HeroSection() {
  return (
    <section className="relative overflow-hidden border-b border-[rgba(0,0,0,0.06)] bg-[#f6f4ef] pt-16">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#faf9f6_0%,#f5f3ee_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(17,17,17,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(17,17,17,0.03)_1px,transparent_1px)] bg-[size:96px_96px] opacity-[0.18]" />

      <div className="hero-media-shell absolute inset-0">
        <img
          src="/hero1.gif"
          alt=""
          aria-hidden="true"
          className="hero-media-layer hero-media-layer-1"
        />
        <img
          src="/hero2.gif"
          alt=""
          aria-hidden="true"
          className="hero-media-layer hero-media-layer-2"
        />
        <img
          src="/hero3.gif"
          alt=""
          aria-hidden="true"
          className="hero-media-layer hero-media-layer-3"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(246,244,239,0.95)_0%,rgba(246,244,239,0.89)_34%,rgba(246,244,239,0.46)_62%,rgba(246,244,239,0.18)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(0,0,0,0.1)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1440px] grid-cols-1 items-end gap-10 px-6 py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)] lg:px-9 lg:py-14">
        <div className="max-w-[760px] self-center pt-10 lg:pt-0">
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.28em] text-[#C7661D]">
            Applied AI For High-Context Technical Environments
          </div>

          <h1 className="mb-5 max-w-[820px] text-[48px] font-bold leading-[0.94] tracking-[-0.065em] text-[#111] sm:text-[60px] lg:text-[74px]">
            Deploy domain-specific AI systems with operational clarity.
          </h1>

          <p className="mb-8 max-w-[650px] text-[18px] leading-[1.72] text-[#404040] lg:text-[19px]">
            Beag Labs builds datasets, evaluation protocols, and model systems
            for robotics, scientific, and operational environments where
            generic models break down.
          </p>

          <div className="mb-10 flex flex-wrap items-center gap-4">
            <a
              href="https://cal.com/comradelemoncake/meet-the-founder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#111] px-6 py-3.5 text-[12px] font-extrabold uppercase tracking-[0.08em] text-white transition-colors duration-200 hover:bg-[#2a2a2a]"
            >
              Start an engagement
            </a>
            <Link
              href="/research"
              className="inline-flex items-center justify-center rounded-full border border-[rgba(17,17,17,0.14)] bg-[rgba(255,255,255,0.5)] px-6 py-3.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#111] transition-colors duration-200 hover:bg-white"
            >
              View research
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            {heroChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.74)] px-4 py-2 text-[12px] text-[#111] backdrop-blur-sm"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <div className="flex h-full items-end justify-end">
          <div className="mb-2 w-full max-w-[292px] rounded-[24px] border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.64)] p-5 backdrop-blur-md">
            <div className="mb-2 text-[10px] uppercase tracking-[0.14em] text-[#6f6f6f]">
              Hero Motion
            </div>
            <div className="mb-3 max-w-[240px] text-[22px] leading-[1.12] text-[#111]">
              Three real worlds, one research and deployment story.
            </div>
            <div className="text-[13px] leading-[1.65] text-[#555]">
              The page opens on flocking behavior, Earth-scale systems, and
              robotics work without resorting to fake product UI.
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
