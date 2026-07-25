const steps = [
  {
    id: "01",
    title: "Tell us what you need",
    description:
      "We'll learn about your data, your infrastructure, and the tasks you want to automate. Then we design a solution — model architecture, deployment target, and a timeline.",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "We build your model",
    description:
      "We connect your data sources, use frontier models to accelerate labeling, fine-tune a compact model for your task, and export it as ONNX — ready to deploy.",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "We deploy on your infra",
    description:
      "We deploy the model on your infrastructure — cloud, on-prem, or air-gapped — and integrate it into your workflows. No runtime API calls to us. Your data stays put.",
    bg: "#E6FFF2",
  },
  {
    id: "04",
    title: "We keep it running",
    description:
      "We monitor accuracy, retrain as your data changes, and optimize performance over time. A model that starts accurate stays accurate.",
    bg: "#FFF9E6",
  },
]

export function EngagementModelSection() {
  return (
    <section className="nb-section-divider bg-[#FAFAF9] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <span className="nb-label mb-5 inline-block">How It Works</span>
          <h2 className="mb-4 max-w-[470px] text-[38px] font-extrabold leading-[1.0] tracking-[-0.04em] text-[#111] lg:text-[48px]">
            From conversation to deployed model — we handle it all.
          </h2>
          <p className="max-w-[430px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Tell us what you need. We design, build, deploy, and maintain
            your custom model on infrastructure you control. No PhD required
            on your side.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className="nb-card group p-8"
              style={{ background: step.bg }}
            >
              <div className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF5F1F]">
                {step.id}
              </div>
              <h3 className="mb-3 text-[22px] font-extrabold leading-[1.08] text-[#111]">
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.7] text-[#444]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
