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
    <section id="capabilities" className="border-b-[3px] border-[#111] bg-[#ff5f1f] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block !bg-white">Capabilities</span>
            <h2 className="display-black max-w-[620px] text-[48px] leading-[0.95] text-[#111] sm:text-[58px] lg:text-[72px]">
              Five ways we ship AI you actually own.
            </h2>
          </div>
          <div className="border-l-[3px] border-[#111] pl-6 lg:pl-8">
            <p className="max-w-[520px] text-[17px] font-semibold leading-[1.6] text-[#181818]">
              Every engagement ends with you owning the code, the model weights, and the operational runbook. No managed-service dependency, no per-inference fees, no data leaving your perimeter.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/capability/${slugFor(service.label)}`}
              className="group flex min-h-[300px] flex-col border-[3px] border-[#111] bg-white p-8 shadow-[6px_6px_0px_0px_#111] transition-all hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[9px_9px_0px_0px_#111] lg:p-9"
            >
              <div className="mb-8 flex items-start justify-between gap-6 border-b-[2px] border-[#111] pb-4">
                <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff5f1f]">{service.label}</span>
                <span className="font-display text-[22px] font-black leading-none text-[#111]">{service.id}</span>
              </div>
              <h3 className="display-black mb-4 text-[30px] leading-[0.98] text-[#111]">{service.title}</h3>
              <p className="text-[14px] leading-[1.65] text-[#333]">{service.description}</p>
              <span className="mt-auto pt-7 font-mono text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#111] transition-all group-hover:translate-x-1">
                Read more →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
