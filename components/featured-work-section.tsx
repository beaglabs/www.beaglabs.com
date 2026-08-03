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
    <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <span className="nb-label mb-5 inline-block">Domains</span>
          <h2 className="mb-4 max-w-[470px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            Built for regulated, document-heavy industries.
          </h2>
          <p className="max-w-[430px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Every domain has its own vocabulary, risk surface, and compliance
            requirements. We adapt to yours — and deploys where
            your security policy demands.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {domains.map((d) => (
            <div
              key={d.label}
              className="nb-card group bg-white p-8"
            >
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                {d.label}
              </div>
              <p className="text-[14px] leading-[1.7] text-[#444]">
                {d.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
