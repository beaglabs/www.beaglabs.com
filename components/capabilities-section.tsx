import Link from "next/link"

const services = [
  {
    id: "01",
    title: "Legacy Data Extraction",
    description:
      "We extract structured data from mainframes, COBOL, AS/400, and scanned documents — then deliver it as validated records into your modern data infrastructure. Source systems are read-only.",
    label: "Extract",
  },
  {
    id: "02",
    title: "AI-Enabled Software Development",
    description:
      "We embed with your engineering team to ship a production AI feature in 6–10 weeks. Data, model, infrastructure, integration — code merged into your repo, model owned by you.",
    label: "Build",
  },
  {
    id: "03",
    title: "Agent UX Consulting",
    description:
      "We design the user-facing surface of your AI agent — interaction patterns, disclosure, error recovery, latency. Working prototype backed by your model.",
    label: "Design",
  },
  {
    id: "04",
    title: "SLM Feasibility & Savings",
    description:
      "We measure whether a small model can serve your workload at lower TCO than your current solution. Written report with go/no-go and 3-year cost projection.",
    label: "Assess",
  },
  {
    id: "05",
    title: "SLM Deployments",
    description:
      "We deploy a small model on your infrastructure — on-prem, air-gapped, VPC, edge. You own the weights, the serving stack, and the data. No license server, no per-inference fee.",
    label: "Deploy",
  },
]

function slugFor(label: string): string {
  return {
    Extract: "modernization",
    Build: "spec-drive-development",
    Design: "agent-ux",
    Assess: "slm-feasibility",
    Deploy: "slm-deployment",
  }[label] ?? ""
}

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block">Capabilities</span>
            <h2 className="max-w-[460px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
              Five ways we ship AI you actually own.
            </h2>
          </div>
          <div>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[#404040] font-medium">
              Every engagement ends with you owning the code, the model
              weights, and the operational runbook. No managed-service
              dependency, no per-inference fees, no data leaving your
              perimeter.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/capability/${slugFor(service.label)}`}
              className="nb-card group flex flex-col bg-white p-8 transition-all hover:shadow-[8px_8px_0px_0px_#ff5f1f] hover:-translate-x-[1px] hover:-translate-y-[1px] lg:p-10"
            >
              <div className="mb-8 flex items-start justify-between gap-6">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
                  {service.label}
                </span>
                <span className="font-mono text-[11px] font-bold text-[#8c8c8c]">
                  {service.id}
                </span>
              </div>
              <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#111]">
                {service.title}
              </h3>
              <p className="text-[13.5px] leading-[1.7] text-[#444] lg:text-[14px]">
                {service.description}
              </p>
              <span className="mt-6 inline-flex items-center gap-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#ff5f1f] transition-all group-hover:gap-2">
                Read more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
