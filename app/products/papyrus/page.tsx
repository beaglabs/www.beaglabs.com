import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, FileText, Layers3, Play, Terminal } from 'lucide-react'

import { Navbar } from '@/components/navbar'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { SiteFooter } from '@/components/site-footer'
import { DocumentDemo } from '@/components/papyrus/document-demo'
import { LegacyAppDemo } from '@/components/papyrus/legacy-app-demo'
import { BASE_URL, pageMetadata } from '@/lib/seo'

const description = 'Papyrus is the customer-hosted Agentic Modernization Factory for document automation, internal app creation, and legacy system enablement—with Microsoft Entra identity and governed execution.'

const baseMetadata = pageMetadata({
  title: 'Papyrus — The Agentic Modernization Factory',
  description,
  path: '/products/papyrus',
  label: 'Papyrus',
  ogTitle: 'Papyrus — The Agentic Modernization Factory',
  ogDescription: 'Customer-hosted document automation, internal app creation, and legacy system enablement—with Microsoft Entra identity and governed execution.',
})

export const metadata: Metadata = {
  ...baseMetadata,
  openGraph: {
    ...baseMetadata.openGraph,
    images: [{ url: `${BASE_URL}/products/papyrus/og?v=2026-10-08-workers-safe`, width: 1200, height: 630, alt: 'Papyrus: The Agentic Modernization Factory. Document automation, internal apps, and legacy system enablement.', type: 'image/png' }],
  },
  twitter: { ...baseMetadata.twitter, images: [`${BASE_URL}/products/papyrus/og?v=2026-10-08-workers-safe`] },
}

const outcomes = [
  { number: '01', title: 'Document automation', body: 'Turn PDFs, policies, spreadsheets, and working documents into requirements, briefings, registers, and repeatable workflows.', Icon: FileText, output: 'From source material to structured work', href: '#documents' },
  { number: '02', title: 'Internal app creation', body: 'Describe the process your team needs. Build a focused app with forms, useful views, and an identity-aware front door.', Icon: Layers3, output: 'From an idea to an app people can use', href: '#factory' },
  { number: '03', title: 'Legacy system enablement', body: 'Put a modern interface in front of an existing workflow. Let the system of record keep doing its job while people get a better experience.', Icon: Terminal, output: 'From terminal screens to service delivery', href: '#factory' },
]

export default function PapyrusProductPage() {
  return (
    <main className="bg-[#fafaf9] text-[#111]">
      <Navbar />
      <section className="overflow-hidden border-b-[3px] border-[#111] pt-16">
        <div className="mx-auto max-w-[1440px]">
          <div className="px-6 py-16 text-center lg:px-9 lg:py-24">
            <div className="text-left"><Breadcrumbs items={[{ name: 'Home', url: '/' }, { name: 'Papyrus', url: '/products/papyrus' }]} /></div>
            <span className="nb-label mb-7 inline-flex items-center gap-2"><span className="h-2 w-2 bg-[#ff5f1f]" />Papyrus / Put your knowledge to work</span>
            <h1 className="mx-auto max-w-[1100px] font-[family-name:var(--font-display)] text-[56px] font-black uppercase leading-[.93] tracking-[-.035em] sm:text-[78px] xl:text-[94px]">The Agentic Modernization Factory</h1>
            <p className="mx-auto mt-7 max-w-[850px] text-[17px] font-medium leading-[1.75] text-[#444]">{description}</p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link href="/contact" className="nb-btn-orange inline-flex items-center gap-3 px-6 py-3.5 text-xs uppercase tracking-wider"><Image src="/products/papyrus/azure.webp" alt="" width={24} height={24} className="h-6 w-6 object-contain" />Request a demonstration<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              <a href="#showcase" className="nb-btn-white inline-flex items-center gap-3 px-6 py-3.5 text-xs uppercase tracking-wider"><Play className="h-4 w-4" aria-hidden="true" />See it in action</a>
            </div>
            <div className="mt-10 flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#555]"><span>Documents → requirements</span><span>Prompts → apps</span><span>Legacy → usable</span></div>
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-white px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1440px]"><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><h2 className="max-w-[650px] text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Three ways to move the mission forward.</h2><p className="max-w-[360px] text-sm leading-6 text-[#555]">Start with a real bottleneck. Turn the knowledge and systems you already own into something your team can use.</p></div>
          <div className="grid border-l-[3px] border-t-[3px] border-[#111] md:grid-cols-3">{outcomes.map(({ number, title, body, Icon, output, href }) => <article key={number} className="flex flex-col border-b-[3px] border-r-[3px] border-[#111] p-6 lg:p-8"><div className="mb-8 flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#b63700]">{number} / 03</span><Icon className="h-7 w-7" aria-hidden="true" /></div><h3 className="text-2xl font-extrabold tracking-tight">{title}</h3><p className="mb-7 mt-4 text-sm leading-7 text-[#555]">{body}</p><a href={href} className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[#111] pt-4 text-xs font-extrabold">{output}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a></article>)}</div>
        </div>
      </section>

      <section id="showcase" className="scroll-mt-24 px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="nb-label mb-5 inline-block">The engine in action</span><h2 className="max-w-[780px] text-[38px] font-extrabold leading-[1.05] tracking-[-.045em] sm:text-[52px]">Less explaining the work.<br />More getting it done.</h2></div><p className="max-w-[390px] text-[15px] leading-7 text-[#555]">A shared workspace for context, agent execution, and useful outputs. Watch Papyrus turn intent into work you can inspect and build on.</p></div>
          <figure className="border-[3px] border-[#111] bg-white p-2 shadow-[8px_8px_0_#111] sm:p-3"><video controls playsInline preload="metadata" aria-label="Papyrus branded product showcase" className="aspect-video w-full bg-[#111]"><source src="/products/papyrus/papyrus-showcase-branded.mp4" type="video/mp4" />Your browser does not support video. <a href="/products/papyrus/papyrus-showcase-branded.mp4">Download the Papyrus showcase.</a></video><figcaption className="flex flex-wrap justify-between gap-2 px-2 pb-1 pt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#666]"><span>Papyrus / Product showcase</span><span>Context → execution → outcomes</span></figcaption></figure>
        </div>
      </section>

      <section id="documents" className="scroll-mt-24 border-y-[3px] border-[#111] bg-white px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]"><div className="mb-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div><span className="nb-label mb-5 inline-block">Document automation</span><h2 className="max-w-[720px] text-[38px] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-[52px]">Your documents are the starting point.<br /><span className="text-[#b63700]">Not the finish line.</span></h2></div><p className="max-w-[480px] self-end text-[16px] leading-7 text-[#555]">Move from reading and re-keying to requirements, decisions, and deliverables. Bring PDFs, Word documents, and spreadsheets into a shared working context, then ask Papyrus to break down the work.</p></div><DocumentDemo /><div className="mt-8 flex flex-wrap gap-6 text-xs font-semibold text-[#555]">{['Requirements with source references', 'Gaps to resolve before delivery', 'Acceptance criteria for the next step'].map(item => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b63700]" aria-hidden="true" />{item}</span>)}</div></div>
      </section>

      <section id="factory" className="scroll-mt-24 px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]"><div className="mb-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div><span className="nb-label mb-5 inline-block">App factory + legacy enablement</span><h2 className="max-w-[720px] text-[38px] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-[52px]">A new front door.<br />For the systems you already have.</h2></div><div className="self-end"><p className="max-w-[500px] text-[16px] leading-7 text-[#555]">Create internal tools and service apps around the workflow. Pair a USWDS-style interface with Login.gov through OIDC, and connect it to a legacy process. Try the example: sign in, submit a request, and watch the terminal record change.</p><div className="mt-6 flex flex-wrap items-center gap-5"><span className="flex items-center gap-2"><Image src="/products/papyrus/uswds.png" alt="" width={40} height={40} className="h-8 w-8 object-contain" /><span className="font-mono text-xs font-bold">USWDS</span></span><span className="text-xl text-[#999]">+</span><Image src="/products/papyrus/login-gov.png" alt="Login.gov" width={320} height={320} className="h-8 w-28 object-cover" /><span className="text-xl text-[#999]">+</span><Image src="/products/papyrus/openid.png" alt="OpenID Connect" width={32} height={32} className="h-8 w-8 object-contain" /><span className="font-mono text-xs font-bold">OIDC</span></div></div></div><LegacyAppDemo /><p className="mt-7 max-w-[800px] text-sm leading-6 text-[#555]">Generated factory apps can have their own authentication front door. Papyrus workspace identity uses Microsoft Entra; the example above shows how an app can present a separate Login.gov / OIDC flow.</p></div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-[#111] px-6 py-14 text-white lg:px-9 lg:py-20"><div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_1fr]"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff9b70]">Your environment. Your operating model.</p><h2 className="mt-5 max-w-[600px] text-4xl font-extrabold leading-[1.05] tracking-[-.04em]">Modernization you can put to work.</h2><p className="mt-5 max-w-[580px] text-[15px] leading-7 text-[#c6c6c6]">Customer-hosted execution keeps Papyrus close to your documents, people, and systems. Connect the tools and inference gateways your workflow needs, and make the useful parts repeatable.</p></div><div className="grid gap-5 sm:grid-cols-2">{[
        ['Microsoft Entra identity', 'Use your organization’s identity for access to the Papyrus workspace.'],
        ['Governed execution', 'Review consequential actions and keep the work visible as it progresses.'],
        ['Tools, MCPs, and gateways', 'Connect the capabilities and model endpoints your environment provides.'],
        ['Reusable skills and artifacts', 'Keep the outputs and working methods that help the next task move faster.'],
      ].map(([title, body]) => <div key={title} className="border-t-2 border-[#ff5f1f] pt-4"><h3 className="text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#c6c6c6]">{body}</p></div>)}</div></div></section>

      <section id="procurement" className="scroll-mt-24 border-b-[3px] border-[#111] bg-white px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Procurement + licensing</span>
          <h2 className="max-w-[900px] text-[38px] font-extrabold leading-[1.05] tracking-[-.045em] sm:text-[52px]">Commercial terms follow the deployment you actually need.</h2>
          <p className="mt-5 max-w-[820px] text-base leading-7 text-[#555]">Papyrus is customer-hosted. Beag Labs can transact through an Azure Marketplace private offer or a direct agreement for controlled and disconnected environments. We do not publish a one-size-fits-all public price card.</p>
          <div className="mt-9 grid gap-6 md:grid-cols-2">
            <article className="border-[3px] border-[#111] bg-[#fafaf9] p-7 shadow-[5px_5px_0_#111]">
              <div className="flex items-center gap-3"><Image src="/products/papyrus/azure.webp" alt="" width={28} height={28} className="h-7 w-7 object-contain" /><h3 className="text-xl font-extrabold">Azure private offer</h3></div>
              <p className="mt-5 text-base leading-7">Deploy the Papyrus VM into your Azure subscription with commercial terms scoped to your organization, program, and support requirements.</p>
              <p className="mt-4 border-t-2 border-[#111] pt-4 text-xs leading-6 text-[#555]">Marketplace is a purchasing and deployment channel. Your signed Papyrus entitlement remains customer-specific rather than a public plan.</p>
            </article>
            <article className="border-[3px] border-[#111] bg-[#fafaf9] p-7 shadow-[5px_5px_0_#111]">
              <h3 className="text-xl font-extrabold">Direct + disconnected</h3>
              <p className="mt-5 text-base leading-7">For on-premises, restricted, or disconnected environments, Beag Labs can issue a signed offline organization license tied to approved Entra tenants and optional exact hostnames.</p>
              <p className="mt-4 border-t-2 border-[#111] pt-4 text-xs leading-6 text-[#555]">One organization license can cover unlimited permitted Papyrus VMs for the agreed term; single-deployment licenses remain available when a contract requires tighter scope.</p>
            </article>
          </div>
          <div className="mt-9"><Link href="/contact" className="nb-btn-orange inline-flex items-center gap-3 px-6 py-3.5 text-xs uppercase tracking-wider">Discuss commercial terms<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </div>
      </section>

      <section className="bg-[#ff5f1f] px-6 py-16 lg:px-9 lg:py-24"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 lg:flex-row lg:items-end"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest">Bring the workflow that needs to change</p><h2 className="mt-4 max-w-[820px] text-[40px] font-extrabold leading-[1.03] tracking-[-.045em] sm:text-[56px]">A document backlog.<br />An internal app.<br />A legacy process worth improving.</h2></div><div className="flex flex-col items-start gap-5"><Link href="/contact" className="nb-btn-white inline-flex items-center gap-3 px-6 py-3.5 text-xs uppercase tracking-wider">Let’s build the next step<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/trust/papyrus" className="text-xs font-bold underline underline-offset-4">Deployment and trust documentation</Link></div></div></section>
      <SiteFooter />
    </main>
  )
}
