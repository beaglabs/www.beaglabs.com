import { BrutalistPhoto } from "@/components/brutalist-photo"

export function FinalCTASection() {
  return (
    <section className="border-b-[3px] border-[#111] bg-[#111] text-white">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-12 px-6 py-14 lg:grid-cols-[1.1fr_minmax(360px,500px)] lg:px-9 lg:py-18">
        <div className="flex flex-col items-start text-left">
          <div className="mb-7 flex items-center gap-3">
            <span className="border-[2px] border-[#111] bg-[#ff5f1f] px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#111] shadow-[3px_3px_0px_0px_#fff]">
              Papyrus on Tradewinds
            </span>
          </div>

          <h2 className="display-black mb-7 max-w-[780px] text-[58px] leading-[0.88] text-white sm:text-[72px] lg:text-[92px]">
            Papyrus is now awardable on Tradewinds
          </h2>

          <div className="mb-7 h-[3px] w-full max-w-[680px] bg-[#ff5f1f]" />

          <p className="mb-3 max-w-[700px] text-[20px] font-extrabold leading-tight tracking-[-0.02em] text-white">
            Papyrus is now awardable on Tradewinds — the DoD's curated AI marketplace — streamlining procurement for government teams.
          </p>

          <p className="mb-8 max-w-[650px] text-[15px] leading-[1.65] text-white/70">
            Deploy our governed agentic platform on your own infrastructure, with the confidence of a DoW-approved solution.
          </p>

          <a
            href="/products/papyrus"
            className="group mb-4 inline-flex items-center gap-3 border-[3px] border-[#111] bg-[#ff5f1f] px-6 py-4 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#111] shadow-[4px_4px_0px_0px_#fff] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-white hover:shadow-[6px_6px_0px_0px_#ff5f1f]"
          >
            View Papyrus
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
            </svg>
          </a>

          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/60">
            Papyrus · SLMs · Agent UX · Awardable now
          </p>
        </div>

        <BrutalistPhoto
          src="https://images.pexels.com/photos/8112199/pexels-photo-8112199.jpeg"
          alt="Open cookbook on a wooden surface"
          badge="MISSION-READY"
          meta="BEAG LABS / PAPYRUS"
          aspect="portrait"
          shadowSize="xl"
          imageClassName="grayscale contrast-125"
          className="mx-auto w-full max-w-[460px]"
        />
      </div>
    </section>
  )
}
