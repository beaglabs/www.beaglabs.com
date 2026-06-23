"use client"

const services = [
  {
    id: "01",
    title: "Dataset Generation",
    description: "High-fidelity synthetic and curated datasets engineered for your domain. We build the data pipelines that make better models possible.",
  },
  {
    id: "02",
    title: "Forward Deployed ML",
    description: "On-site or remote machine learning engineering and research. We embed with your team to build models that work in the real world, not just in the lab.",
  },
  {
    id: "03",
    title: "Fine-Tuning",
    description: "Foundation model specialization for your domain. We deliver models that understand your data, your constraints, and your infrastructure requirements.",
  },
  {
    id: "04",
    title: "Domain-Model Curation",
    description: "Evaluation, selection, and deployment of efficient small language models. Right-sized intelligence for your specific use case.",
  },
]

export function CapabilitiesSection() {
  return (
    <section id="services" className="relative bg-white py-24 lg:py-28 px-6 lg:px-8 border-t border-[rgba(0,0,0,0.06)]">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-16">
          <div className="lg:col-span-4">
            <div className="font-mono text-[9px] tracking-[0.2em] text-[#8B7355] uppercase mb-5 font-medium">
              Capabilities
            </div>
            <h2 className="text-[28px] lg:text-[32px] font-medium text-[#111] tracking-[-0.02em] leading-[1.2]">
              Research-driven
              <br />
              AI services
            </h2>
          </div>
          <div className="lg:col-span-5 lg:col-start-7 flex items-end">
            <p className="text-[15px] text-[#555] leading-[1.75]">
              Every engagement is grounded in rigorous methodology. We don&apos;t apply off-the-shelf solutions — we engineer systems tailored to your problem space, your data, and your operational constraints.
            </p>
          </div>
        </div>

        {/* Service grid — 2x2 with subtle separators */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[rgba(0,0,0,0.06)] border border-[rgba(0,0,0,0.06)]">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white p-10 group hover:bg-[#FAFAF9] transition-colors duration-200"
            >
              <div className="flex items-start justify-between mb-8">
                <span className="font-mono text-[11px] text-[#999]">
                  {service.id}
                </span>
              </div>
              <h3 className="text-[16px] font-medium text-[#111] mb-3 tracking-[-0.01em]">
                {service.title}
              </h3>
              <p className="text-[13px] text-[#555] leading-[1.75]">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
