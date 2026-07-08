const services = [
  {
    id: "01",
    title: "Data Connectors",
    description:
      "Plug into the tools your team already uses. OAuth connectors for Gmail, GitHub, HubSpot, Notion — or drop a CSV. Your data never leaves your environment, and we never train on it.",
    label: "Ingest",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "Intelligent Labeling",
    description:
      "Frontier models label your data. Our disagreement engine flags only the 2-5% of examples that need human review — the rest are auto-labeled.",
    label: "Label",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "Custom Training",
    description:
      "Fine-tune models from 500M to 5B parameters for classification, extraction, and relevance. Same training recipe used to replicate expert judgment in financial tasks.",
    label: "Train",
    bg: "#E6FFF2",
  },
  {
    id: "04",
    title: "Model Export & Deploy",
    description:
      "Export your trained model as ONNX and deploy anywhere — cloud, on-prem, or air-gapped. You own the weights, not us.",
    label: "Deploy",
    bg: "#FFF9E6",
  },
]

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block">Platform</span>
            <h2 className="max-w-[460px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
              Everything you need to deploy domain-specific AI.
            </h2>
          </div>
          <div>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[#404040] font-medium">
              From raw documents to a deployed model in hours, not months.
              Frontier models handle the heavy lifting on labeling. Your
              experts review only the hard cases. The result is a model
              tuned to your domain that you control end-to-end.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {services.map((service) => (
            <div
              key={service.title}
              className="nb-card group flex flex-col p-8 lg:p-10"
              style={{ background: service.bg }}
            >
              <div className="mb-8 flex items-start justify-between gap-6">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                  {service.label}
                </span>
                <span className="font-mono text-[11px] font-bold text-[#8c8c8c]">
                  {service.id}
                </span>
              </div>
              <h3 className="mb-3 text-[26px] font-extrabold leading-[1.05] tracking-[-0.03em] text-[#111]">
                {service.title}
              </h3>
              <p className="text-[14px] leading-[1.7] text-[#444] lg:text-[15px]">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
