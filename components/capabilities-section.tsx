const services = [
  {
    id: "01",
    title: "Data Pipeline Engineering",
    description:
      "We connect to your data sources, clean and preprocess your documents, and prepare them for model development — all within your environment. Your data never leaves your infrastructure.",
    label: "Pipeline",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "Model Development",
    description:
      "We design and fine-tune compact models for your specific classification and extraction tasks. Frontier models accelerate the labeling process; your experts review only the edge cases.",
    label: "Develop",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "Deployment Engineering",
    description:
      "We export your model as ONNX and deploy it on your infrastructure — cloud, on-prem, or air-gapped. No runtime API calls back to us. You own the weights, not us.",
    label: "Deploy",
    bg: "#E6FFF2",
  },
  {
    id: "04",
    title: "Production Support",
    description:
      "We monitor model performance, retrain as your data evolves, and keep your models accurate at scale. You get a deployed model that stays relevant — not a one-time handoff.",
    label: "Support",
    bg: "#FFF9E6",
  },
]

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block">Services</span>
            <h2 className="max-w-[460px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
              We build, deploy, and maintain your domain AI.
            </h2>
          </div>
          <div>
            <p className="max-w-[480px] text-[17px] leading-[1.65] text-[#404040] font-medium">
              From raw documents to a deployed model running on your
              infrastructure — we handle the pipeline end to end.
              You own the weights. Your data never leaves your environment.
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
