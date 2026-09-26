const domains = [
  {
    label: "Legal",
    desc: "E-discovery, contract classification, and privilege review — trained on your documents, deployed on your hardware.",
  },
  {
    label: "Healthcare",
    desc: "Clinical document triage, adverse event classification, and prior authorization extraction in HIPAA-compliant environments.",
  },
  {
    label: "Finance",
    desc: "Research relevance filtering, KYC document review, and regulatory filing classification at a fraction of frontier API cost.",
  },
  {
    label: "Government & Defense",
    desc: "Intelligence report categorization and FOIA triage deployed on air-gapped infrastructure where commercial APIs can't reach.",
  },
]

export function FeaturedWorkSection() {
  return (
    <section className="border-b-[3px] border-[#111] bg-white px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <div className="lg:sticky lg:top-32">
          <span className="nb-label mb-5 inline-block">Domains</span>
          <h2 className="display-black mb-5 max-w-[560px] text-[48px] leading-[0.95] text-[#111] sm:text-[58px] lg:text-[70px]">
            Built for regulated, document-heavy industries.
          </h2>
          <p className="max-w-[470px] border-t-[3px] border-[#111] pt-5 text-[17px] font-medium leading-[1.65] text-[#333]">
            Every domain has its own vocabulary, risk surface, and compliance requirements. We adapt to yours — and deploy where your security policy demands.
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
