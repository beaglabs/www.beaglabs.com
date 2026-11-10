import { GridPattern } from "@/components/ui/grid-pattern"

const PLATFORMS = [
  "Microsoft Entra ID",
  "Microsoft 365",
  "SharePoint",
  "Teams",
  "Exchange",
  "AWS GovCloud",
  "Azure Government",
  "Fargate Graviton",
] as const

/** Bordered logo/wordmark grid in the logo-cloud-2 style, tuned to the site's brutalist system. */
export function LogoCloud() {
  return (
    <section className="relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#faf0eb] py-14 text-[#1a1714]">
      <GridPattern width={36} height={36} />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6 lg:px-9">
        <p className="mb-8 text-center font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#5b4a3d]">
          Runs inside the stack you already have
        </p>
        {/* The 3px gap over a #1a1714 grid paints the cell dividers */}
        <div className="grid grid-cols-2 gap-[3px] border-[3px] border-[#1a1714] bg-[#1a1714] shadow-[6px_6px_0_#1a1714] sm:grid-cols-4">
          {PLATFORMS.map((name) => (
            <div key={name} className="flex h-20 items-center justify-center bg-[#fffaf3] px-4 text-center transition-colors hover:bg-[#f7c995]">
              <span className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#3d2f26]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
