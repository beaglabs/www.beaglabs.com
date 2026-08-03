import { BrutalistPhoto } from "@/components/brutalist-photo"

export function FinalCTASection() {
  return (
    <section className="border-y-[3px] border-[#111] bg-[#111] text-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-[1.1fr_minmax(360px,500px)] lg:px-9 lg:py-14">
        <div className="flex flex-col items-start text-left">
          <div className="mb-6 flex items-center gap-3">
            <span className="border-[2px] border-white bg-white px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] text-[#111]">
              Free
            </span>
            <span className="block h-px w-10 bg-white/40" />
            <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">2026 edition</span>
          </div>

          <h2 className="text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-white sm:text-[60px] lg:text-[72px]">
            The ML Engineer&rsquo;s
          </h2>
          <h2 className="text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-white sm:text-[60px] lg:text-[72px]">
            Cookbook
          </h2>
          <h2 className="mb-6 text-[48px] font-extrabold leading-[1.05] tracking-[-0.055em] text-white sm:text-[60px] lg:text-[72px]">
            2026 Edition
          </h2>

          <p className="mb-2 max-w-[700px] text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-white">
            52 recipes — GRPO, Flow Matching, World Models, and everything in between
          </p>

          <p className="mb-8 max-w-[650px] text-[15px] leading-[1.65] text-white/70">
            Training methodologies for AI engineers who build — with pipeline
            diagrams, compute estimates, and paper references. 7 domains,
            no filler.
          </p>

          <hr className="mb-8 w-full max-w-[650px] border-0 border-t-[2px] border-white/30" />

          <a
            href="/beag-labs-ml-cookbook-2026.pdf"
            download
            className="nb-btn-white group mb-3 inline-flex items-center gap-3 px-6 py-3 text-[12px]"
          >
            Download the PDF
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 4v12m0 0l-5-5m5 5l5-5M4 20h16"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="square"
                strokeLinejoin="miter"
              />
            </svg>
          </a>

          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            PDF · 52 recipes · 7 parts · No email required
          </p>
        </div>

        <BrutalistPhoto
          src="https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg"
          alt="Open cookbook on a wooden surface"
          badge="52 RECIPES"
          meta="beaglabs / cookbook"
          rounded
          className="mx-auto w-full max-w-[480px]"
        />
      </div>
    </section>
  )
}
