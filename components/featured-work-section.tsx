export function FeaturedWorkSection() {
  return (
    <section className="border-t border-[rgba(0,0,0,0.08)] bg-[#f6f4ef] px-6 py-24 lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <div className="mb-5 font-mono text-[10px] uppercase tracking-[0.26em] text-[#C7661D]">
            Operating Environments
          </div>
          <h2 className="mb-4 max-w-[470px] text-[34px] font-bold leading-[1.03] tracking-[-0.045em] text-[#111] lg:text-[42px]">
            Systems work that holds up in real operational settings.
          </h2>
          <p className="mb-8 max-w-[460px] text-[17px] leading-[1.72] text-[#4e4e4e]">
            Beag Labs works where context matters: sensor-rich environments,
            infrastructure-scale analysis, and robotics workflows where a model
            has to integrate cleanly with operators, data, and constraints.
          </p>
          <div className="grid max-w-[460px] gap-4 sm:grid-cols-2">
            <div className="border-t border-[rgba(17,17,17,0.12)] pt-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7c7c7c]">
                Context
              </div>
              <div className="mt-2 text-[16px] leading-[1.45] text-[#111]">
                Real-world deployment conditions and analyst workflows.
              </div>
            </div>
            <div className="border-t border-[rgba(17,17,17,0.12)] pt-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#7c7c7c]">
                Outcome
              </div>
              <div className="mt-2 text-[16px] leading-[1.45] text-[#111]">
                Systems that are observable, testable, and usable by teams.
              </div>
            </div>
          </div>
        </div>

        <div className="border border-[rgba(17,17,17,0.1)] bg-[rgba(255,255,255,0.76)] p-5">
          <div className="relative aspect-[1.45/1] overflow-hidden bg-[#ebe7df]">
            <img
              src="/geo.gif"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full object-cover brightness-[0.9] contrast-[1.02]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.12))]" />
            <div className="absolute bottom-4 left-4 max-w-[260px] border border-[rgba(255,255,255,0.18)] bg-[rgba(16,16,16,0.58)] p-4 text-white backdrop-blur-md">
              <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-[#FFB074]">
                Operational Systems
              </div>
              <div className="text-[20px] leading-[1.08]">
                High-context decision surfaces for sensor-rich environments.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
