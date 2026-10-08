const domains = [
  {
    label: "Legal",
    desc: "Organize contract documents, review queues and related operational workflows.",
  },
  {
    label: "Healthcare",
    desc: "Explore document intake and review workflows with deployment controls appropriate to healthcare environments.",
  },
  {
    label: "Finance",
    desc: "Structure financial document reviews, internal request applications and controlled approval flows.",
  },
  {
    label: "Government & Defense",
    desc: "Connect legacy services, automate document processes and create internal tools for controlled environments.",
  },
]

export function FeaturedWorkSection() {
  return (
    <section className="border-b-[3px] border-[#111] bg-white px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="lg:sticky lg:top-32">
          <span className="nb-label mb-5 inline-block">Domains</span>
          <h2 className="display-black mb-5 max-w-[560px] text-[48px] leading-[0.95] text-[#111] sm:text-[58px] lg:text-[70px]">
            Designed for complicated, document-heavy work.
          </h2>
          <p className="max-w-[470px] border-t-[3px] border-[#111] pt-5 text-[17px] font-medium leading-[1.65] text-[#333]">
            Different teams have different processes and security constraints. Start with the workflow and design the right controls around it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {domains.map((d, index) => (
            <div
              key={d.label}
              className="group min-h-[250px] border-[3px] border-[#111] bg-[#FAFAF9] p-8 shadow-[6px_6px_0px_0px_#ff5f1f] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[9px_9px_0px_0px_#ff5f1f]"
            >
              <div className="mb-8 flex items-center justify-between border-b-[2px] border-[#111] pb-4">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#ff5f1f]">Domain</span>
                <span className="font-display text-[22px] font-black">0{index + 1}</span>
              </div>
              <h3 className="display-black mb-4 text-[30px] leading-none text-[#111]">{d.label}</h3>
              <p className="text-[14px] leading-[1.7] text-[#333]">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
