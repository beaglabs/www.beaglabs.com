const steps = [
  {
    id: "01",
    title: "Chat with us",
    description:
      "Tell us what you're building. We'll design a labeling schema, hand-pick the best frontier model for your data, and ship you a custom data recipe you can run yourself — or we'll run it for you.",
    bg: "#FFF3E6",
  },
  {
    id: "02",
    title: "Train with intelligent labeling",
    description:
      "Frontier models auto-label your examples. Our disagreement engine surfaces the 2-5% where the model is uncertain — those are the only ones your team reviews.",
    bg: "#E6F2FF",
  },
  {
    id: "03",
    title: "Co-Review the hard cases",
    description:
      "A keyboard-driven review interface lets your domain experts correct contested labels in minutes. No CSV export, no spreadsheet ping-pong.",
    bg: "#E6FFF2",
  },
  {
    id: "04",
    title: "Deploy your model",
    description:
      "Export as ONNX and deploy on your infrastructure — cloud, on-prem, or air-gapped. You own the model. We don't touch your inference data.",
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
            From raw data to deployed model in under 24 hours.
          </h2>
          <p className="max-w-[430px] text-[17px] leading-[1.65] text-[#404040] font-medium">
            Four steps, no PhD required. Connect your data, let frontier
            models handle the labeling, review the edge cases, and deploy a
            model you own on infrastructure you control.
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
