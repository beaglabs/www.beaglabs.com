const steps = [
  {
    id: "01",
    title: "Scope",
    description:
      "We'll learn about your data, your infrastructure, and the tasks you want to automate. Then we design a solution — model architecture, deployment target, and a timeline.",
  },
  {
    id: "02",
    title: "Build",
    description:
      "We connect your data sources, use frontier models to accelerate labeling, fine-tune a compact model for your task, and export it as ONNX — ready to deploy.",
  },
  {
    id: "03",
    title: "Deploy",
    description:
      "We deploy the model on your infrastructure — cloud, on-prem, or air-gapped — and integrate it into your workflows. No runtime API calls to us. Your data stays put.",
  },
  {
    id: "04",
    title: "Operate",
    description:
      "We monitor accuracy, retrain as your data changes, and optimize performance over time. A model that starts accurate stays accurate.",
  },
]

export function EngagementModelSection() {
  return (
    <section className="border-b-[3px] border-[#111] bg-[#ff5f1f] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto max-w-[1440px]">
        <div className="mb-14 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-end">
          <div>
            <span className="nb-label mb-5 inline-block !bg-white">How It Works</span>
            <h2 className="display-black max-w-[700px] text-[48px] leading-[0.95] text-[#111] sm:text-[58px] lg:text-[72px]">
              From conversation to deployed model — we handle it all.
            </h2>
          </div>
          <p className="max-w-[500px] border-l-[3px] border-[#111] pl-6 text-[17px] font-semibold leading-[1.6] text-[#181818] lg:pl-8">
            Tell us what you need. We design, build, deploy, and maintain your custom model on infrastructure you control. No PhD required on your side.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.id} className="flex min-h-[300px] flex-col border-[3px] border-[#111] bg-white p-7 shadow-[6px_6px_0px_0px_#111]">
              <div className="mb-9 font-display text-[54px] font-black leading-none text-[#ff5f1f]">{step.id}</div>
              <h3 className="display-black mb-4 text-[31px] leading-none text-[#111]">{step.title}</h3>
              <p className="text-[14px] leading-[1.7] text-[#333]">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
