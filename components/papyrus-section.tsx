import Link from "next/link"
import { ArrowRight } from "lucide-react"

const PILLARS = [
  ["Configurable data models", "Classes for your own record types, mapped to the systems that hold them."],
  ["Durable agents", "Long-running work that checkpoints, retries and resumes."],
  ["Human approvals", "Consequential actions wait for a person before they happen."],
  ["Governed workflows", "Every step and decision recorded for audit."],
] as const

/** Papyrus in its own band on the homepage: the product Beag Labs builds and deploys with. */
export function PapyrusSection() {
  return (
    <section id="papyrus" aria-label="Papyrus" className="border-b-[3px] border-[#111] bg-[#111] px-6 py-20 text-white lg:px-9 lg:py-28">
      <div className="mx-auto grid max-w-[1200px] gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:items-center lg:gap-16">
        <div>
          <span className="nb-label mb-6 inline-block !bg-[#ff5f1f] !text-[#111]">Our product · Papyrus</span>
          <h2 className="display-black text-[length:min(44px,9vw)] leading-[.95] sm:text-[60px] lg:text-[68px]">
            Backoffice Superintelligence Harness
          </h2>
          <p className="mt-6 max-w-[620px] text-lg font-medium leading-8 text-[#e6e6e6]">
            A deployable AI execution platform that enables organizations to automate complex back-office operations across existing systems of record using configurable data models, durable agents, human approvals, and governed workflows.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {PILLARS.map(([title, text]) => (
              <li key={title} className="border-2 border-white/80 bg-[#1b1b1b] p-4">
                <span className="block text-sm font-extrabold uppercase tracking-wide text-[#ff5f1f]">{title}</span>
                <span className="mt-1 block text-sm leading-6 text-[#cfcfcf]">{text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link href="/products/papyrus" className="inline-flex items-center gap-2 border-[3px] border-white bg-[#ff5f1f] px-6 py-3 text-xs font-black uppercase tracking-wide text-[#111] shadow-[5px_5px_0_#fff] hover:bg-white">
              Explore Papyrus <ArrowRight className="h-4 w-4" strokeWidth={3} />
            </Link>
            <a href="/contact" className="inline-flex items-center gap-2 border-b-2 border-white pb-0.5 text-[12px] font-extrabold uppercase tracking-[.08em] hover:border-[#ff5f1f] hover:text-[#ff5f1f]">
              Get started with commercial <ArrowRight className="h-3.5 w-3.5" strokeWidth={3} />
            </a>
          </div>
        </div>

        <div className="aspect-video w-full overflow-hidden border-[3px] border-white bg-black shadow-[10px_10px_0_#ff5f1f]">
          <video
            className="h-full w-full object-cover"
            src="/products/papyrus-product-tour.mp4"
            poster="/products/papyrus-product-tour-poster.jpg"
            controls
            playsInline
            preload="none"
            aria-label="Papyrus product tour: Classes and Resources"
          />
        </div>
      </div>
    </section>
  )
}
