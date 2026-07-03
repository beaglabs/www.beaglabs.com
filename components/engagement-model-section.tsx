const steps = [
  {
    id: "01",
    title: "Frame the domain",
    description:
      "Map the technical environment, workflows, stakeholders, and reliability constraints that actually define the problem.",
  },
  {
    id: "02",
    title: "Build the data",
    description:
      "Create or curate the datasets, evaluation surfaces, and review loops the system needs to improve safely.",
  },
  {
    id: "03",
    title: "Adapt the model",
    description:
      "Tune and shape model behavior around the operating context rather than optimizing for generic benchmark performance.",
  },
  {
    id: "04",
    title: "Deploy with the team",
    description:
      "Embed the system into live workflows, then validate outcomes with the people actually using it.",
  },
]

export function EngagementModelSection() {
  return (
    <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Engagement Model
          </div>
          <h2 className="mb-4 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
            A simple process section that makes the work legible.
          </h2>
          <p className="max-w-[430px] text-[17px] leading-[1.72] text-[#4e4e4e]">
            This keeps the homepage enterprise-credible by showing how Beag
            Labs works, not just what it claims.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {steps.map((step) => (
            <div
              key={step.id}
              className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.72)] p-8 backdrop-blur-sm"
            >
              <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-[#C7661D]">
                {step.id}
              </div>
              <h3 className="mb-3 text-[22px] leading-[1.08] text-[#111]">
                {step.title}
              </h3>
              <p className="text-[14px] leading-[1.75] text-[#555]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
