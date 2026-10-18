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
    <section className="relative overflow-hidden border-b-[3px] border-[#111] bg-[#faf0eb] py-14 text-[#111]">
      <GridPattern width={36} height={36} />
      <div className="relative z-10 mx-auto max-w-[1100px] px-6 lg:px-9">
        <p className="mb-8 text-center font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#555]">
          Runs inside the stack you already have
        </p>
        {/* The 3px gap over a #111 grid paints the cell dividers */}
        <div className="grid grid-cols-2 gap-[3px] border-[3px] border-[#111] bg-[#111] shadow-[6px_6px_0_#111] sm:grid-cols-4">
          {PLATFORMS.map((name) => (
            <div key={name} className="flex h-20 items-center justify-center bg-white px-4 text-center transition-colors hover:bg-[#ffdfcf]">
              <span className="text-[12px] font-extrabold uppercase tracking-[.08em] text-[#333]">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
