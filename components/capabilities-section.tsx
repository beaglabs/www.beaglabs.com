const services = [
  {
    id: "01",
    title: "Dataset Generation",
    description:
      "High-fidelity synthetic generation and curation pipelines shaped to real operating conditions, edge cases, and domain constraints.",
    label: "Data",
  },
  {
    id: "02",
    title: "Forward Deployed ML",
    description:
      "Embedded technical work inside active research and operational workflows, where models must survive contact with reality.",
    label: "Deployment",
  },
  {
    id: "03",
    title: "Model Adaptation",
    description:
      "Fine-tuning and system adaptation for specialized terminology, structured reasoning, and domain-specific performance targets.",
    label: "Adaptation",
  },
  {
    id: "04",
    title: "Evaluation Systems",
    description:
      "Benchmarks, protocol design, and review loops that make model behavior visible, testable, and actionable for operators.",
    label: "Evaluation",
  },
]

export function CapabilitiesSection() {
  return (
    <section
      id="capabilities"
      className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
              Capabilities
            </div>
            <h2 className="max-w-[430px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
              Research-led systems for technically difficult domains.
            </h2>
          </div>
          <div>
            <p className="max-w-[480px] text-[17px] leading-[1.72] text-[#4e4e4e]">
              Every engagement begins with the dataset. We construct evaluation
              surfaces that expose model failure modes, then build the tooling
              to close the gap between benchmark scores and operational reality.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.title}
              className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.72)] p-8 backdrop-blur-sm transition-colors duration-200 hover:bg-white lg:p-10"
            >
              <div className="mb-8 flex items-start justify-between gap-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                  {service.label}
                </span>
                <span className="font-mono text-[11px] text-[#8c8c8c]">
                  {service.id}
                </span>
              </div>
              <h3 className="mb-3 text-[24px] leading-[1.08] tracking-[-0.03em] text-[#111]">
                {service.title}
              </h3>
              <p className="text-[14px] leading-[1.75] text-[#555] lg:text-[15px]">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
