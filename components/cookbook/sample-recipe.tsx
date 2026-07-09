const sampleRecipe = {
  title: "On-Policy Distillation",
  complexity: 4,
  usedBy: ["Thinking Machines", "Frontier reasoning models"],
  coreIdea:
    "Instead of learning from teacher answers, let the student generate responses and have the teacher correct those trajectories.",
  pipeline: ["Teacher", "Student Rollout", "Teacher Corrections", "Loss", "Repeat"],
}

export function SampleRecipe() {
  return (
    <div className="nb-card p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="nb-label text-[10px]">Sample Recipe</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#FF5F1F]">
          {'★'.repeat(sampleRecipe.complexity)}{'☆'.repeat(5 - sampleRecipe.complexity)}
        </span>
      </div>

      <h3 className="mb-3 text-[24px] font-extrabold tracking-[-0.03em] text-[#111]">
        {sampleRecipe.title}
      </h3>

      <div className="mb-4 flex flex-wrap gap-2">
        {sampleRecipe.usedBy.map((u) => (
          <span key={u} className="nb-chip text-[10px]">
            {u}
          </span>
        ))}
      </div>

      <p className="mb-6 text-[14px] leading-[1.65] text-[#555]">
        {sampleRecipe.coreIdea}
      </p>

      <div className="border-[2px] border-[#111] bg-[#FAFAF9] p-5">
        <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#999]">
          Training Pipeline
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {sampleRecipe.pipeline.map((step, i) => (
            <span key={step} className="flex items-center gap-2">
              <span className="border-[2px] border-[#111] bg-white px-3 py-2 font-mono text-[10px] font-bold text-[#111]">
                {step}
              </span>
              {i < sampleRecipe.pipeline.length - 1 && (
                <span className="text-[16px] text-[#FF5F1F]">&rarr;</span>
              )}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
