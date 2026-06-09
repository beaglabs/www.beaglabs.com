"use client"

import { Database, Bot, Cpu, Layers } from "lucide-react"

const services = [
  {
    icon: Database,
    id: "01",
    title: "Dataset Generation",
    description: "High-fidelity synthetic and curated datasets engineered for your domain. We build the data pipelines that make better models possible.",
  },
  {
    icon: Bot,
    id: "02",
    title: "Robotics",
    description: "Perception, planning, and control systems. We bring AI out of the cloud and into physical environments with production-grade reliability.",
  },
  {
    icon: Cpu,
    id: "03",
    title: "Fine-Tuning",
    description: "Foundation model specialization for your domain. We deliver models that understand your data, your constraints, and your infrastructure requirements.",
  },
  {
    icon: Layers,
    id: "04",
    title: "SLM Curation",
    description: "Evaluation, selection, and deployment of efficient small language models. Right-sized intelligence for your specific use case.",
  },
]

export function CapabilitiesSection() {
  return (
    <section id="services" className="relative bg-white py-32 px-6 lg:px-8 border-t border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">
          <div className="lg:col-span-4">
            <div className="font-mono text-xs tracking-widest text-[#FF5F1F] uppercase mb-6">
              Capabilities
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#0a0a0a] tracking-[-0.03em]">
              Research-driven
              <br />
              AI services
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-6 flex items-end">
            <p className="text-base text-[#6B7280] leading-[1.8] font-light">
              Every engagement is grounded in rigorous methodology. We don&apos;t apply off-the-shelf solutions — we engineer systems tailored to your problem space, your data, and your operational constraints.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#E5E7EB] border border-[#E5E7EB]">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white p-10 group hover:bg-[#FAFAFA] transition-colors"
            >
              <div className="flex items-start justify-between mb-8">
                <div className="w-10 h-10 flex items-center justify-center border border-[#FF5F1F]/20">
                  <service.icon className="w-5 h-5 text-[#FF5F1F]" strokeWidth={1.5} />
                </div>
                <span className="font-mono text-xs text-[#C0C0C0] tracking-wide">
                  {service.id}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#0a0a0a] mb-3 tracking-[-0.01em]">
                {service.title}
              </h3>
              <p className="text-sm text-[#6B7280] leading-[1.8] font-light">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
