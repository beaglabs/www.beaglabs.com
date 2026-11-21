import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowRight, ArrowUpRight, Blocks, Bot, Handshake, Landmark, Layers, ScrollText, Store, TerminalSquare } from "lucide-react"
import { GroovyNeon } from "@/components/groovy-neon"
import { BriefRequestForm } from "@/components/brief-request-form"
import { StripeArc, SunriseFoot } from "@/components/home/sunrise-foot"
import { company } from "@/data/company"

/*
 * The home page: Beag Labs as a GovCon solutions and product studio (NAICS 541511), laid out with the same rhythm as
 * papyrus.beaglabs.com: centred hero over a ribbon foot, a drafting title block of company data, a deployment
 * marquee, three competency cards, a cascade of sticky engagement cards, a dark spotlight on 70s stripes, ways to
 * buy, and a closing CTA. Company facts come from data/company.ts and the Nov 2026 white paper; keep them in step.
 */

const PAPYRUS = "https://papyrus.beaglabs.com"
const container = "mx-auto w-[min(1240px,100%-32px)]"
const tag = "inline-flex items-center gap-2 rounded-[2px] border-[1.5px] border-[#1a1714] bg-[#e5632f] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[.16em] text-[#1a1714] shadow-[3px_3px_0_#1a1714]"
const buttonPrimary = "inline-flex items-center gap-2 rounded-md border-2 border-[#1a1714] bg-[#e5632f] px-7 py-3.5 text-[17px] font-semibold text-[#1a1714] shadow-[3px_3px_0_#1a1714] transition hover:-translate-x-px hover:-translate-y-px hover:bg-[#f7c995] hover:shadow-[4px_4px_0_#1a1714]"
const buttonOutline = "inline-flex items-center gap-2 rounded-md border-2 border-[#1a1714] bg-[#fffaf4] px-7 py-3.5 text-[17px] font-semibold text-[#1a1714] shadow-[3px_3px_0_#1a1714] transition hover:-translate-x-px hover:-translate-y-px hover:bg-[#fde3c8] hover:shadow-[4px_4px_0_#1a1714]"
const buttonDark = "inline-flex items-center gap-2 rounded-md border-2 border-[#1a1714] bg-[#1a1714] px-5 py-2.5 font-semibold text-[#fafafa] transition hover:-translate-y-px hover:bg-[#e5632f] hover:text-[#1a1714]"
const display = "font-display font-extrabold tracking-[-.025em] [font-variation-settings:'SOFT'_100,'WONK'_1,'opsz'_144]"
const sectionTitle = `${display} text-[length:clamp(2.2rem,4.6vw,3.7rem)] leading-[.98]`
const mono = "font-mono text-[11px] font-bold uppercase tracking-[.16em]"
const icon = "h-[1.05em] w-[1.05em]"

function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`${tag} ${className}`}><span aria-hidden="true" className="block h-[7px] w-[7px] rounded-[1px] bg-[#1a1714]" /> {children}</p>
}

function SectionHead({ title, lede, left = false }: { title: ReactNode; lede?: ReactNode; left?: boolean }) {
  return (
    <div className={`mb-12 grid gap-4 ${left ? "justify-items-start" : "justify-items-center text-center"}`}>
      <h2 className={sectionTitle}>{title}</h2>
      {lede && <p className="max-w-[40rem] text-[1.15rem] leading-[1.55] text-[#5b4a3d]">{lede}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ Hero */

function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-28">
      <div className={`${container} relative z-10 grid justify-items-center gap-7 text-center`}>
        <Tag>GovCon solutions + product studio · NAICS 541511</Tag>
        <h1 className={`${display} max-w-[19ch] text-[length:clamp(2.6rem,6.2vw,4.9rem)] leading-[1]`}>
          We build <span className="home-neon"><GroovyNeon text="groovy" /></span> software <em className="font-bold italic text-[#e5632f]">for the public mission.</em>
        </h1>
        <p className="max-w-[46rem] text-[1.2rem] leading-[1.55] text-[#5b4a3d]">
          Beag Labs is a small-business studio for custom software and AI agents. Federal, defense and SLED teams bring us a mission problem; we scope it, build it inside their boundary, carry it through the ATO and keep it running.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a className={buttonPrimary} href="#solution-brief">Get our solution brief <ArrowRight className={icon} /></a>
          <Link className={buttonOutline} href="/contact">Talk to the studio <ArrowUpRight className={icon} /></Link>
        </div>
      </div>
      <SunriseFoot />
    </section>
  )
}

/* ------------------------------------------------------------------ Company data, as a drawing title block */

const TITLE_BLOCK: { label: string; value: ReactNode; wide?: boolean; accent?: boolean }[] = [
  { label: "Entity", value: <>Beag Labs, Inc.<br />Small business</> },
  { label: "UEI / CAGE", value: <>{company.uei}<br />{company.cage}</> },
  { label: "Primary NAICS", value: <>541511<br /><span className="font-medium text-[#5b4a3d]">Custom computer programming</span></>, wide: true },
  { label: "Also small under", value: <>541512 · 541513<br />541519 · 513210</> },
  { label: "Status", value: <>Non-traditional defense contractor<br /><span className="font-medium text-[#5b4a3d]">Awardable on Tradewinds</span></>, wide: true },
]

function TitleBlock() {
  return (
    <section aria-label="Company data" className="relative z-10 -mt-24 pb-14 sm:-mt-28">
      <div className={container}>
        <dl className="grid overflow-hidden rounded-[3px] border-2 border-[#1a1714] bg-[#fffaf4] shadow-[4px_4px_0_#1a1714] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.35fr_1fr_1.5fr]">
          {TITLE_BLOCK.map(cell => (
            <div key={cell.label} className="border-t-[1.5px] border-[#1a1714] px-4 pb-4 pt-3 first:border-t-0 sm:[&:nth-child(2)]:border-t-0 lg:border-l-[1.5px] lg:border-t-0 lg:first:border-l-0">
              <dt className={`${mono} mb-1 text-[10px] text-[#b2391a]`}>{cell.label}</dt>
              <dd className="text-[15px] font-bold leading-[1.4]">{cell.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Where it runs */

const ENVIRONMENTS = ["AWS GovCloud", "Azure Government", "On-premises racks", "Air-gapped enclaves", "Microsoft Entra ID", "Microsoft 365", "SharePoint", "ServiceNow", "eMASS", "Mainframe TN3270", "Oracle", "Salesforce"]

function Marquee() {
  const row = [...ENVIRONMENTS, ...ENVIRONMENTS]
  return (
    <section className="border-y border-[#1a171426] bg-[#fde3c8] pb-9 pt-6">
      <p className="mb-5 text-center font-semibold">We build inside the environments and systems your agency already runs</p>
      <div className="home-marquee overflow-hidden">
        <div className="home-marquee-track flex w-max gap-4">
          {row.map((name, index) => (
            <span key={index} aria-hidden={index >= ENVIRONMENTS.length || undefined} className="inline-flex items-center gap-2.5 whitespace-nowrap rounded-md border-2 border-[#1a1714] bg-[#fffaf4] py-2 pl-2 pr-4 font-semibold shadow-[3px_3px_0_#1a1714]">
              <span className="grid h-7 w-7 place-items-center rounded-[3px] bg-[#f7c995] font-mono text-[10px] font-bold">{name.split(/\s+/).map(word => word[0]).join("").slice(0, 2)}</span>
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Core competencies */

const COMPETENCIES = [
  { title: "Custom mission applications", body: "Case management, intake portals, dashboards and internal tools designed with the people who use them and built on your data, your identity provider and your hosting.", points: ["Product discovery and UX", "Full-stack engineering", "Code and IP delivered to you"], icon: <Blocks />, tone: "#e9c896" },
  { title: "AI agents and automation", body: "Agents that take the manual, cross-system work off your staff: reading documents, preparing packages and moving records, with a person approving anything consequential.", points: ["Document and records workflows", "Human approval on every risky step", "Every action on the audit trail"], icon: <Bot />, tone: "#f7b267" },
  { title: "Legacy modernization", body: "COBOL, mainframe screens and SOAP services understood, wrapped and moved forward one workflow at a time, without a big-bang rewrite or a frozen mission.", points: ["System and data mapping", "API layers over legacy cores", "Incremental cutover plans"], icon: <TerminalSquare />, tone: "#e5632f" },
]

function Competencies() {
  return (
    <section className="py-16 sm:py-24">
      <div className={container}>
        <SectionHead title="Core competencies" lede="What a contracting officer would find under 541511 on our capability statement, and what your program office actually gets." />
        <div className="grid gap-6 md:grid-cols-3">
          {COMPETENCIES.map(card => (
            <article key={card.title} className="relative grid content-start gap-4 overflow-hidden rounded-md border-2 border-[#1a1714] bg-[#fffaf4] p-8 shadow-[4px_4px_0_#1a1714] transition hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0_#1a1714]">
              <span aria-hidden="true" className="absolute -right-14 -top-14 aspect-square w-36 rounded-full border-2 border-[#1a1714]" style={{ background: card.tone }} />
              <span className="grid h-13 w-13 place-items-center rounded border-2 border-[#1a1714] shadow-[2px_2px_0_#1a1714] [&_svg]:h-6 [&_svg]:w-6" style={{ background: card.tone }}>{card.icon}</span>
              <h3 className="font-display text-[1.5rem] font-bold leading-[1.15] tracking-[-.015em]">{card.title}</h3>
              <p className="leading-[1.55] text-[#5b4a3d]">{card.body}</p>
              <ul className="grid gap-2 border-t-[1.5px] border-dashed border-[#1a171466] pt-4">
                {card.points.map(point => (
                  <li key={point} className="flex items-start gap-2.5 text-[15px] font-semibold">
                    <span aria-hidden="true" className="mt-[.35em] block h-2 w-2 shrink-0 rounded-[1px] border-[1.5px] border-[#1a1714] bg-[#e5632f]" />{point}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ How an engagement runs */

/** The deliverables for one phase, as a drafting-sheet readout. */
function Deliverables({ phase, rows }: { phase: string; rows: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-md border-2 border-[#1a1714] bg-[#fffaf4]">
      <div className={`${mono} flex items-center justify-between border-b-2 border-[#1a1714] bg-[#1a1714] px-4 py-2.5 text-[#fffaf3]`}>
        <span>Deliverables · {phase}</span>
        <span className="flex gap-1.5" aria-hidden="true"><i className="block h-2.5 w-2.5 rounded-full bg-[#e5632f]" /><i className="block h-2.5 w-2.5 rounded-full bg-[#f7b267]" /><i className="block h-2.5 w-2.5 rounded-full bg-[#e9c896]" /></span>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 border-t-[1.5px] border-dashed border-[#1a171466] px-4 py-3 first:border-t-0 sm:grid-cols-[11rem_1fr] sm:gap-4">
            <dt className={`${mono} text-[#b2391a]`}>{label}</dt>
            <dd className="text-[15px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

const PHASES = [
  { label: "Discovery", title: "Start with the mission, not a demo", body: "We sit with your program office and the people doing the work, map the systems and the boundary, and write a solution brief that is specific enough to price and to buy.", rows: [["Solution brief", "Problem, users and outcomes"], ["Architecture", "Hosting, identity, data flows"], ["Rough order", "Scope, team and timeline"], ["Buying path", "The vehicle that fits"]] },
  { label: "Prototype", title: "Working software in weeks, in your environment", body: "A thin, real slice running where it will live, put in front of real users early. Feedback lands while it is cheap, and leadership sees progress instead of slides.", rows: [["Prototype", "Deployed inside your boundary"], ["User sessions", "Every sprint, with your staff"], ["Demo", "For leadership and stakeholders"], ["Backlog", "Prioritized with the program"]] },
  { label: "Build + ATO", title: "Security and authorization in the plan from day one", body: "We build on hardened foundations and keep the evidence as we go: every agent action recorded, access tied to your identity provider, documentation your assessors can work from.", rows: [["Production release", "Hardened and tested"], ["Security docs", "Inputs for your SSP and controls"], ["Audit trail", "Who, what and why, recorded"], ["Runbooks", "Install, operate, recover"]] },
  { label: "Transition", title: "Yours to keep, with us on call", body: "You get the code, the documentation and the knowledge transfer. Keep us on for sustainment and new features, or run it yourself; either way nothing phones home to us.", rows: [["Source and IP", "Delivered per your contract"], ["Training", "For admins and end users"], ["Sustainment", "Optional, sized to need"], ["Roadmap", "Next increments, if you want them"]] },
] satisfies { label: string; title: string; body: string; rows: [string, string][] }[]

function Engagement() {
  return (
    <section className="relative pb-28 pt-16 sm:pt-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[28rem] bg-gradient-to-b from-transparent to-[#fde3c8]" />
      <div className={`${container} relative`}>
        <SectionHead title={<>How we work. <span className="text-[#8f7a68]">From kickoff to sustainment.</span></>} />
        <div className="grid gap-10 pb-8">
          {PHASES.map((phase, index) => (
            <article key={phase.label} className="grid items-center gap-10 rounded-md border-2 border-[#1a1714] p-6 shadow-[6px_6px_0_#1a1714] md:sticky md:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]" style={{ top: `${96 + index * 22}px`, background: index === 2 ? "#fde3c8" : "#fffaf4" }}>
              <div className="grid justify-items-start gap-4">
                <span className="inline-flex items-center gap-2.5 text-[.95rem] font-bold">
                  <b className="grid h-8 w-8 place-items-center rounded-full border-2 border-[#1a1714] bg-[#e5632f] text-[.8rem] shadow-[2px_2px_0_#1a1714]">{String(index + 1).padStart(2, "0")}</b>
                  {phase.label}
                </span>
                <h3 className={`${display} text-[2rem] leading-[1.05]`}>{phase.title}</h3>
                <p className="text-[1.05rem] leading-[1.6] text-[#5b4a3d]">{phase.body}</p>
              </div>
              <div className="min-w-0"><Deliverables phase={phase.label} rows={phase.rows} /></div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Studio-built product */

function StudioProduct() {
  return (
    <section className="home-stripes relative overflow-hidden pb-24 pt-32">
      <StripeArc className="pointer-events-none absolute right-[8%] top-12 z-20 hidden md:block" width={200} />
      <div className={container}>
        <div className="relative z-10 grid gap-10 rounded-md border-[3px] border-[#1a1714] bg-[linear-gradient(160deg,#1a1714_55%,#3a2418)] p-6 text-[#fffaf4] shadow-[8px_8px_0_#1a1714] sm:p-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-end">
          <div className="grid justify-items-start gap-5">
            <Tag className="!border-[#fffaf4] !shadow-[3px_3px_0_#fffaf4]">Studio-built</Tag>
            <h2 className={`${display} text-[length:clamp(1.9rem,3.6vw,2.75rem)] leading-[1.05]`}>We ship our own product, so your budget goes to your mission.</h2>
            <p className="text-[1.1rem] leading-[1.6] text-[#d8d4cd]">
              Papyrus is the customer-hosted agent runtime we built and own. It is the foundation we bring to engagements: identity, approvals and the audit trail already done, so your contract pays for the work only your mission needs.
            </p>
            <a className={buttonPrimary} href={PAPYRUS}>See Papyrus <ArrowUpRight className={icon} /></a>
          </div>
          <dl className="grid gap-3">
            {[["Built by", "Beag Labs, the original supplier"], ["Runs", "On your infrastructure, nothing calls home"], ["Buy it", "Awardable on the CDAO Tradewinds Solutions Marketplace"]].map(([label, value]) => (
              <div key={label} className="rounded-md border-2 border-[#fffaf4]/70 bg-[#ffffff0d] px-4 py-3">
                <dt className={`${mono} text-[10px] text-[#f7b267]`}>{label}</dt>
                <dd className="mt-1 font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Ways to buy */

const WAYS = [
  { title: "Tradewinds Solutions Marketplace", body: "Papyrus is Awardable on the CDAO marketplace, a pre-vetted path for DoD buyers.", icon: <Store /> },
  { title: "Small-business awards", body: "Direct awards and set-asides under NAICS 541511, where we are a small business.", icon: <Landmark /> },
  { title: "Other Transactions", body: "As a non-traditional defense contractor we can work on OT prototype agreements.", icon: <ScrollText /> },
  { title: "Teaming with primes", body: "We sub to integrators who need a studio for the custom software and AI layer.", icon: <Handshake /> },
]

function WaysToBuy() {
  return (
    <section className="bg-[#fdeee1] py-16 sm:py-24">
      <div className={`${container} grid items-start gap-12 lg:grid-cols-[1fr_2fr]`}>
        <div className="grid justify-items-start gap-5">
          <h2 className={sectionTitle}>Ways to work with us</h2>
          <p className="text-[1.1rem] leading-[1.55] text-[#5b4a3d]">Contracting officers, program managers and primes: we will meet you on the vehicle that fits.</p>
          <span className="inline-flex items-center gap-2 text-[#b2391a] [&_svg]:h-5 [&_svg]:w-5"><Layers /><span className={mono}>UEI {company.uei} · CAGE {company.cage}</span></span>
        </div>
        <div className="grid gap-8 sm:grid-cols-2">
          {WAYS.map(item => (
            <div key={item.title} className="grid content-start gap-3 border-t-2 border-[#1a1714] pt-5">
              <span className="text-[#b2391a] [&_svg]:h-7 [&_svg]:w-7">{item.icon}</span>
              <h3 className="font-display text-[1.35rem] font-bold tracking-[-.015em]">{item.title}</h3>
              <p className="leading-[1.55] text-[#5b4a3d]">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ Closing CTA with the brief form */

function Cta() {
  return (
    <section id="solution-brief" className="relative scroll-mt-24 overflow-hidden bg-gradient-to-b from-[#fde3c8] to-[#f5e1cc] pb-24 pt-24 text-center">
      <StripeArc className="pointer-events-none absolute left-[6%] top-10 hidden md:block" width={220} />
      <StripeArc className="pointer-events-none absolute right-[10%] top-36 hidden lg:block" width={150} />
      <div className={`${container} relative z-10 grid justify-items-center gap-8`}>
        <h2 className={`${sectionTitle} max-w-[18ch]`}>Have a mission problem worth building for?</h2>
        <p className="-mt-3 max-w-[36rem] text-[1.1rem] leading-[1.55] text-[#5b4a3d]">Get the four-page solution brief: what we build, how an engagement runs and how to buy it.</p>
        <div className="w-full max-w-[34rem] rounded-md border-2 border-[#1a1714] bg-[#fffaf4] p-6 text-left shadow-[6px_6px_0_#1a1714] sm:p-8">
          <p className={`${mono} mb-4 text-[#c2410c]`}>Solution brief · 4-page PDF</p>
          <BriefRequestForm briefType="services" placement="hero" stacked />
        </div>
        <Link href="/contact" className={buttonDark}>Or talk to the studio <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </section>
  )
}

export function HomePage() {
  return (
    <>
      <Hero />
      <TitleBlock />
      <Marquee />
      <Competencies />
      <Engagement />
      <StudioProduct />
      <WaysToBuy />
      <Cta />
    </>
  )
}
