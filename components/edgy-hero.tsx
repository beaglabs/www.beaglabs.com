"use client"

import type { ReactNode } from "react"
import { ArrowDown } from "lucide-react"
import { HeroBackdrop } from "@/components/hero-backdrop"

/** Grainient presets in our palette. Pages pick one so heroes feel related but not identical. */
const BACKGROUNDS = {
  /** Homepage: black lower left through orange to peach. */
  ember: { colors: ["#1a1714", "#c2410c", "#e5632f", "#ffb894"], type: "linear", angle: 325, dark: false },
  /** Product pages: mostly dark, a radial orange core. */
  furnace: { colors: ["#1a1714", "#1a0a04", "#c2410c", "#e5632f"], type: "radial", angle: 0, dark: true },
  /** Solutions: peach top left falling to black lower right. */
  dusk: { colors: ["#ffb894", "#e5632f", "#c2410c", "#5a1d06"], type: "linear", angle: 220, dark: false },
  /** Comparisons and trust: black field with an orange signal band. */
  signal: { colors: ["#1a1714", "#e5632f", "#1a1714", "#c2410c"], type: "linear", angle: 100, dark: true },
  /** Light pages (contact, support, blog): paper and peach, for long reading below. */
  daylight: { colors: ["#fdeee1", "#fde3c8", "#ffb894", "#e5632f"], type: "linear", angle: 35, dark: false },
} as const
export type HeroBackground = keyof typeof BACKGROUNDS

/** A printer's crop mark for one corner of the hero frame. */
function CropMark({ corner, dark }: { corner: "tl" | "tr" | "bl" | "br"; dark: boolean }) {
  const position = { tl: "left-4 top-4", tr: "right-4 top-4 rotate-90", bl: "bottom-4 left-4 -rotate-90", br: "bottom-4 right-4 rotate-180" }[corner]
  return <span aria-hidden="true" className={`pointer-events-none absolute z-20 h-6 w-6 border-l-[3px] border-t-[3px] ${dark ? "border-[#fffaf3]" : "border-[#1a1714]"} ${position}`} />
}

export type EdgyHeroProps = {
  /** Small black mono tag above the headline. */
  eyebrow: string
  /** The headline in three parts; `slab` sits on the black tilted slab. Any part may be omitted. */
  before?: ReactNode
  slab?: ReactNode
  /** `ink` sets the slab on the tilted ink block; `neon` hangs it bare on the paper, like a sign. */
  slabStyle?: "ink" | "neon"
  after?: ReactNode
  /** White-on-black strip under the headline. */
  description?: ReactNode
  /** Breadcrumb or other line above the eyebrow. */
  breadcrumb?: ReactNode
  /** Buttons or extra content under the description. */
  actions?: ReactNode
  /** Right-hand column: wrapped in the frosted panel unless `asideBare`. */
  aside?: ReactNode
  asideLabel?: string
  asideBare?: boolean
  /** `wide` gives the aside more than half the row, for live demos. */
  asideWidth?: "narrow" | "wide"
  background?: HeroBackground
  /** Frame readouts. */
  coordinates?: string
  status?: string
  next?: { href: string; label: string }
  /** `full` fills the first screen (homepage); `page` is shorter. */
  height?: "full" | "page"
  /** Headline scale; long titles use `md`. */
  size?: "xl" | "lg" | "md"
  id?: string
}

const HEADLINE = {
  // Sized for Fraunces, which runs much wider than the condensed face these were first set for.
  xl: "text-[length:min(34px,6.6vw)] sm:text-[52px] lg:text-[56px] xl:text-[66px] 2xl:text-[74px]",
  lg: "text-[length:min(30px,7.6vw)] sm:text-[44px] lg:text-[50px] xl:text-[58px]",
  md: "text-[length:min(26px,7vw)] sm:text-[36px] lg:text-[42px] xl:text-[48px]",
}

/** The edgy hero: big headline on Papyrus paper with the B_ ribbon, ink strip, frosted side panel, crop marks. */
export function EdgyHero({
  eyebrow, before, slab, slabStyle = "ink", after, description, breadcrumb, actions, aside, asideLabel, asideBare = false, asideWidth = "narrow",
  background = "ember", coordinates = "38.8977° N · 77.0365° W", status = "Agents online · humans in charge", next,
  height = "page", size = "lg", id,
}: EdgyHeroProps) {
  // Every hero now sits on Papyrus paper with the B_ ribbon, so all of them read as light. `background` is kept
  // for the existing call sites; its gradient presets are no longer drawn.
  const bg = { ...BACKGROUNDS[background], dark: false }
  const light = true
  const readout = light ? "text-[#1a1714]" : "text-[#fffaf3]"
  return (
    <section id={id} className="relative overflow-hidden border-b-[3px] border-[#1a1714] bg-[#1a1714] text-[#1a1714]">
      <HeroBackdrop />

      <CropMark corner="tl" dark={bg.dark} /><CropMark corner="tr" dark={bg.dark} /><CropMark corner="bl" dark={bg.dark} /><CropMark corner="br" dark={bg.dark} />
      <span aria-hidden="true" className={`absolute right-14 top-5 z-20 hidden font-mono text-[10px] font-bold uppercase tracking-[.18em] md:block ${readout}`}>{coordinates}</span>
      <span aria-hidden="true" className={`absolute bottom-5 left-14 z-20 hidden items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] md:flex ${readout}`}>
        <i className="block h-2 w-2 animate-pulse bg-[#e5632f]" /> {status}
      </span>
      {next && <a href={next.href} className={`absolute bottom-5 right-14 z-20 hidden items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[.18em] hover:underline md:flex ${readout}`}>
        {next.label} <ArrowDown className="h-3.5 w-3.5" strokeWidth={3} />
      </a>}

      <div className={`relative z-20 mx-auto grid max-w-[1440px] content-center gap-10 px-6 lg:px-14 ${aside ? (asideWidth === "wide" ? "xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-center xl:gap-12" : "xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:items-end xl:gap-14") : ""} ${height === "full" ? "min-h-[calc(100svh-67px)] py-24" : "min-h-[560px] py-20 lg:py-24"}`}>
        <div className="min-w-0">
          {breadcrumb && <div className={`mb-5 font-mono text-[11px] font-bold uppercase tracking-[.14em] ${light ? "text-[#3d2f26]" : "text-[#fffaf3]"}`}>{breadcrumb}</div>}
          <span className={`mb-7 inline-flex items-center gap-2 rounded-full border-[3px] border-[#1a1714] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.18em] ${bg.dark ? "bg-[#fffaf3] text-[#1a1714]" : "bg-[#1a1714] text-[#fffaf3]"}`}>
            <i aria-hidden="true" className="block h-2 w-2 bg-[#e5632f]" /> {eyebrow}
          </span>
          <h1 className={`display-black leading-[.88] [overflow-wrap:normal] ${HEADLINE[size]} ${bg.dark ? "text-[#fffaf3]" : "text-[#1a1714]"}`}>
            {before && <span className="block">{before}</span>}
            {slab && slabStyle === "neon" && <span className="hero-neon-line">{slab}</span>}
            {slab && slabStyle === "ink" && <span className={`my-2 block w-fit max-w-full -rotate-1 rounded-xl px-3 pb-1 sm:px-5 ${bg.dark ? "bg-[#fffaf3] text-[#1a1714] shadow-[5px_5px_0_#e5632f] sm:shadow-[8px_8px_0_#e5632f]" : "bg-[#1a1714] text-[#e5632f] shadow-[5px_5px_0_#fde3c8] sm:shadow-[8px_8px_0_#fde3c8]"}`}>{slab}</span>}
            {after && <span className="block">{after}</span>}
          </h1>
          {description && <div className={`mt-9 max-w-[660px] rounded-r-2xl border-l-[6px] border-[#e5632f] px-5 py-4 text-[16px] font-semibold leading-[1.6] sm:text-[18px] ${bg.dark ? "bg-[#fde3c8] text-[#1a1714]" : "bg-[#1a1714] text-[#fffaf3]"}`}>{description}</div>}
          {actions && <div className="mt-8 flex flex-wrap items-center gap-4">{actions}</div>}
        </div>

        {aside && (asideBare
          ? <div className="min-w-0">{aside}</div>
          : <div className="relative mr-2 max-w-[560px] rounded-[1.5rem] border-[3px] border-[#1a1714] bg-[#fffaf3] p-5 shadow-[6px_6px_0_#1a1714] sm:mr-0 sm:p-7 sm:shadow-[10px_10px_0_#1a1714]">
            {asideLabel && <p className="mb-4 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[#c2410c]">{asideLabel}</p>}
            {aside}
          </div>)}
      </div>
    </section>
  )
}

/** Buttons that read well on every hero background. */
export const heroButtonPrimary = "inline-flex items-center gap-2 rounded-full border-[3px] border-[#1a1714] bg-[#e5632f] px-6 py-4 text-xs font-black uppercase tracking-wide text-[#1a1714] shadow-[5px_5px_0_#1a1714] hover:bg-[#1a1714] hover:text-[#fffaf3]"
export const heroButtonSecondary = "inline-flex items-center gap-2 rounded-full border-[3px] border-[#1a1714] bg-[#fffaf3] px-6 py-4 text-xs font-black uppercase tracking-wide text-[#1a1714] shadow-[5px_5px_0_#1a1714] hover:bg-[#fde3c8]"
