import type { Metadata } from 'next'
import { ArrowRight, Bot, Check, Database, FileText } from 'lucide-react'

import { Breadcrumbs } from '@/components/breadcrumbs'
import { PageHero } from '@/components/page-hero'
import { SiteFooter } from '@/components/site-footer'
import { DocumentDemo } from '@/components/papyrus/document-demo'
import { LegacyAppDemo } from '@/components/papyrus/legacy-app-demo'
import { TrialCtaLink } from '@/components/trial-cta-link'
import { BASE_URL, pageMetadata } from '@/lib/seo'

const description = 'Papyrus is an agentic ERP: one data model for your customers, vendors, invoices and payments, with agents that run the back-office work and people who approve what matters.'

const baseMetadata = pageMetadata({
  title: 'Papyrus — The Agentic ERP',
  description,
  path: '/products/papyrus',
  label: 'Papyrus',
  ogTitle: 'Papyrus — The Agentic ERP',
  ogDescription: 'One data model for your business. Agents run AP, AR, intake and reconciliation; people approve what matters.',
})

export const metadata: Metadata = {
  ...baseMetadata,
  openGraph: {
    ...baseMetadata.openGraph,
    images: [{ url: `${BASE_URL}/products/papyrus/og?v=2026-10-18-superintelligent-erp`, width: 1200, height: 630, alt: 'Papyrus: the agentic ERP. One data model for your business, run by agents.', type: 'image/png' }],
  },
  twitter: { ...baseMetadata.twitter, images: [`${BASE_URL}/products/papyrus/og?v=2026-10-18-superintelligent-erp`] },
}

const outcomes = [
  { number: '01', title: 'A data model of your business', body: 'Customers, vendors, invoices, payments and the records you define, in one model that agents read, understand and keep in shape.', Icon: Database, output: 'From scattered systems to one source of truth', href: '#showcase' },
  { number: '02', title: 'Agents on the back office', body: 'Agents work AP and AR, intake, approvals and reconciliation end to end. People step in where a decision matters.', Icon: Bot, output: 'From queues to work that gets done', href: '#operating' },
  { number: '03', title: 'Documents in, ledger out', body: 'Invoices, contracts, forms and spreadsheets become structured records in the ledger, with the source attached.', Icon: FileText, output: 'From rekeying to records', href: '#documents' },
]

export default function PapyrusProductPage() {
  return (
    <main className="bg-[#fafaf9] text-[#111]">

      <PageHero
        label="Papyrus · Agentic ERP"
        title="The Agentic ERP"
        description={description}
        above={<Breadcrumbs items={[{ name: 'Home', url: '/' }, { name: 'Papyrus', url: '/products/papyrus' }]} />}
        below={<div className="flex flex-wrap justify-center gap-x-5 gap-y-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#555]"><span>Records → agents</span><span>Documents → ledger</span><span>People → approvals</span></div>}
      />

      <section className="border-b-[3px] border-[#111] bg-white px-6 py-14 lg:px-9">
        <div className="mx-auto max-w-[1440px]"><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><h2 className="max-w-[650px] text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">One system. Run by agents.</h2><p className="max-w-[360px] text-sm leading-6 text-[#555]">Papyrus keeps the records of your business and the agents that work them in the same place.</p></div>
          <div className="grid border-l-[3px] border-t-[3px] border-[#111] md:grid-cols-3">{outcomes.map(({ number, title, body, Icon, output, href }) => <article key={number} className="flex flex-col border-b-[3px] border-r-[3px] border-[#111] p-6 lg:p-8"><div className="mb-8 flex items-center justify-between"><span className="font-mono text-xs font-bold text-[#b63700]">{number} / 03</span><Icon className="h-7 w-7" aria-hidden="true" /></div><h3 className="text-2xl font-extrabold tracking-tight">{title}</h3><p className="mb-7 mt-4 text-sm leading-7 text-[#555]">{body}</p><a href={href} className="mt-auto flex items-center justify-between gap-3 border-t-2 border-[#111] pt-4 text-xs font-extrabold">{output}<ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" /></a></article>)}</div>
        </div>
      </section>

      <section id="showcase" className="scroll-mt-8 px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]"><div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="nb-label mb-5 inline-block">Papyrus in action</span><h2 className="max-w-[780px] text-[length:min(38px,9vw)] font-extrabold leading-[1.05] tracking-[-.045em] sm:text-[52px]">Less keying in.<br />More getting it done.</h2></div><p className="max-w-[390px] text-[15px] leading-7 text-[#555]">Agents read the data model, do the work and leave a record you can inspect. Watch Papyrus take a request from intake to done.</p></div>
          <figure className="border-[3px] border-[#111] bg-white p-2 shadow-[8px_8px_0_#111] sm:p-3"><video controls playsInline preload="metadata" aria-label="Papyrus product showcase" className="aspect-video w-full bg-[#111]"><source src="/products/papyrus/papyrus-showcase-branded.mp4" type="video/mp4" />Your browser does not support video. <a href="/products/papyrus/papyrus-showcase-branded.mp4">Download the Papyrus showcase.</a></video><figcaption className="flex flex-wrap justify-between gap-2 px-2 pb-1 pt-3 font-mono text-[10px] font-bold uppercase tracking-wider text-[#666]"><span>Papyrus / Product showcase</span><span>Records → agents → approvals</span></figcaption></figure>
        </div>
      </section>

      <section id="documents" className="scroll-mt-8 border-y-[3px] border-[#111] bg-white px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]"><div className="mb-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div><span className="nb-label mb-5 inline-block">Documents in, ledger out</span><h2 className="max-w-[720px] text-[length:min(38px,9vw)] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-[52px]">Every document becomes a record.<br /><span className="text-[#b63700]">Not another inbox.</span></h2></div><p className="max-w-[480px] self-end text-[16px] leading-7 text-[#555]">Invoices, contracts, forms and spreadsheets come in; agents read them, check them against what the ledger already knows and draft the record. Try the example below on sample documents.</p></div><DocumentDemo /><div className="mt-8 flex flex-wrap gap-6 text-xs font-semibold text-[#555]">{['Structured records, not rekeying', 'Mismatches flagged before they post', 'People approve what matters'].map(item => <span key={item} className="flex items-center gap-2"><Check className="h-4 w-4 text-[#b63700]" aria-hidden="true" />{item}</span>)}</div></div>
      </section>

      <section id="factory" className="scroll-mt-8 px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]"><div className="mb-9 grid gap-6 lg:grid-cols-[1.1fr_.9fr]"><div><span className="nb-label mb-5 inline-block">Apps on your records</span><h2 className="max-w-[720px] text-[length:min(38px,9vw)] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-[52px]">A new front door.<br />On the same data model.</h2></div><p className="max-w-[500px] self-end text-[16px] leading-7 text-[#555]">Give your team and your customers focused apps for requests, approvals and status, built on the records Papyrus already holds. Older systems keep doing their job behind a modern interface. Try the example: sign in, submit a request, and watch the record change.</p></div><LegacyAppDemo /><p className="mt-7 max-w-[800px] text-sm leading-6 text-[#555]">Apps can have their own sign-in front door. Your team signs in to Papyrus with Microsoft; the example shows an app with a separate OpenID Connect flow.</p></div>
      </section>

      <section id="operating" className="scroll-mt-8 border-y-[3px] border-[#111] bg-[#111] px-6 py-14 text-white lg:px-9 lg:py-20"><div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_1fr]"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#ff9b70]">Agents do the work. People decide.</p><h2 className="mt-5 max-w-[600px] text-[length:min(2.25rem,9vw)] font-extrabold leading-[1.05] tracking-[-.04em]">A back office that runs itself.</h2><p className="mt-5 max-w-[580px] text-[15px] leading-7 text-[#c6c6c6]">Papyrus runs at your own address, close to your records and your people. Agents work the queue; anything consequential waits for a person to approve it.</p></div><div className="grid gap-5 sm:grid-cols-2">{[
        ['Microsoft sign-in', 'Your team signs in with the Microsoft accounts they already use.'],
        ['Approvals where they matter', 'Payments, postings and other consequential actions wait for a person.'],
        ['Connected tools', 'Connect the systems and MCP tools your back office already relies on.'],
        ['Every action on the record', 'See what each agent did, to which record, and why.'],
      ].map(([title, body]) => <div key={title} className="border-t-2 border-[#ff5f1f] pt-4"><h3 className="text-base font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[#c6c6c6]">{body}</p></div>)}</div></div></section>

      <section id="start" className="scroll-mt-8 border-b-[3px] border-[#111] bg-white px-6 py-16 lg:px-9 lg:py-24">
        <div className="mx-auto max-w-[1440px]">
          <span className="nb-label mb-5 inline-block">Getting started</span>
          <h2 className="max-w-[900px] text-[length:min(38px,9vw)] font-extrabold leading-[1.05] tracking-[-.045em] sm:text-[52px]">Sign up. Go live at your own address.</h2>
          <p className="mt-5 max-w-[820px] text-base leading-7 text-[#555]">Papyrus starts at papyrus.beaglabs.com. Your workspace gets its own address, your team signs in with Microsoft, and the agents start on your records.</p>
          <div className="mt-9 grid gap-6 md:grid-cols-3">
            {[
              ['01', 'Sign up', 'Create your account at papyrus.beaglabs.com.'],
              ['02', 'Go live', 'Papyrus comes up at your own address, ready for your team.'],
              ['03', 'Bring your records', 'Add customers, vendors and invoices. The agents take it from there.'],
            ].map(([number, title, body]) => <article key={number} className="border-[3px] border-[#111] bg-[#fafaf9] p-7 shadow-[5px_5px_0_#111]">
              <span className="font-mono text-xs font-bold text-[#b63700]">{number} / 03</span>
              <h3 className="mt-4 text-xl font-extrabold">{title}</h3>
              <p className="mt-3 text-base leading-7">{body}</p>
            </article>)}
          </div>
          <div className="mt-9"><TrialCtaLink placement="section" className="nb-btn-orange inline-flex items-center gap-3 px-6 py-3.5 text-xs uppercase tracking-wider">Try Papyrus now<ArrowRight className="h-4 w-4" aria-hidden="true" /></TrialCtaLink></div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
