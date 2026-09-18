import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck, Download, FileJson2, FileText } from 'lucide-react'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Papyrus',
    description:
      'A self-hosted, multi-agent product workspace for turning mission needs into requirements, user stories, success metrics, and delivery plans.',
    path: '/products/papyrus',
    label: 'Product',
    images: [
      {
        url: '/products/papyrus-workspace.png',
        width: 2047,
        height: 1167,
        alt: 'Papyrus multi-agent product workspace',
      },
    ],
  })
}

const agents = [
  {
    number: '01',
    title: 'MCP (Model Context Protocol)',
    description:
      'An open standard that lets AI applications securely connect to external data sources, tools, and workflows',
  },
  {
    number: '02',
    title: 'Tools',
    description:
      'Browsers, fetch, and other functionality that lets agents access the right data and perform calculations and actions deterministically for the mission',
  },
  {
    number: '03',
    title: 'Skills',
    description:
      'A lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.',
  },
  {
    number: '04',
    title: 'Security',
    description:
      'Brings security considerations into the work as it forms, instead of treating them as a final review gate.',
  },
]

const deploymentFacts = [
  'Runs inside your environment',
  'No required public relay or discovery service',
  'Commercial, NIPRNet / IL4, and SIPRNet / IL6 profiles',
  'Machine-readable OSCAL controls and CycloneDX SBOM',
]

const alignedWith = [
  {
    title: 'DoD IL4',
    detail: 'Customer-managed controlled environment profile',
    logo: 'https://www.war.gov/portals/1/Page-Assets/branding-guide/logos/png/DOW-Logo-Stacked-1-Color.png',
  },
  {
    title: 'DoD IL6',
    detail: 'Customer-managed classified environment profile',
    logo: 'https://www.war.gov/portals/1/Page-Assets/branding-guide/logos/png/DOW-Logo-Stacked-1-Color.png',
  },
  {
    title: 'NIST SP 800-53 Rev. 5',
    detail: '35 documented control mappings',
    logo: 'https://hyperproof.io/wp-content/uploads/2023/06/framework-informational-page_hero-badges-nist-800-53.png',
  },
] as const

const artifacts = [
  {
    title: 'OSCAL component definition',
    detail: 'OSCAL 1.2.1 · v0.2.0',
    href: '/compliance/papyrus-component-definition.json',
    source: 'https://github.com/beaglabs/papyrus/blob/main/compliance/papyrus-component-definition.json',
    icon: FileJson2,
  },
  {
    title: 'CycloneDX SBOM',
    detail: 'CycloneDX 1.7 · 85 components',
    href: '/compliance/cyclonedx.sbom.json',
    source: 'https://github.com/beaglabs/papyrus/blob/main/compliance/cyclonedx.sbom.json',
    icon: ShieldCheck,
  },
  {
    title: 'FOSSA third-party report',
    detail: 'Dependency licenses and notices · PDF',
    href: 'https://github.com/beaglabs/papyrus/raw/refs/heads/main/compliance/third-party-software-report.pdf',
    source: 'https://github.com/beaglabs/papyrus/blob/main/compliance/third-party-software-report.pdf',
    icon: FileText,
    logo: 'https://avatars.githubusercontent.com/u/9543448?s=280&v=4',
  },
  {
    title: 'SPDX SBOM',
    detail: 'SPDX 2.3 · 85 packages',
    href: '/sbom.spdx.json',
    source: 'https://github.com/beaglabs/papyrus/blob/main/sbom.spdx.json',
    icon: FileJson2,
  },
] as const

export default function PapyrusProductPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <section className="overflow-hidden border-b-[3px] border-[#111] pt-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex min-h-[620px] flex-col justify-center px-6 py-20 lg:border-r-[3px] lg:border-[#111] lg:px-9 lg:py-24">
            <h1 className="max-w-[720px] text-[52px] font-extrabold leading-[.98] tracking-[-0.055em] sm:text-[66px] lg:text-[78px]">
              Mission ready agentic dominance in your boundary.
            </h1>
            <p className="mt-7 max-w-[650px] text-[18px] font-medium leading-[1.7] text-[#444]">
              Papyrus is a self-hosted and governed agentic harness for high-trust operational teams. It turns the natural language of a mission problem into structured outputs and executed workflows. 
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="mailto:james@beaglabs.com?subject=Papyrus%20demonstration"
                className="nb-btn-orange inline-flex items-center gap-2 px-6 py-3.5 text-[12px] uppercase tracking-[0.08em]"
              >
                Request a demonstration
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
              <Link
                href="/trust/papyrus"
                className="nb-btn-white inline-flex items-center gap-2 px-6 py-3.5 text-[12px] uppercase tracking-[0.08em]"
              >
                Review trust center
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-8 flex items-center">
              <Image
                src="/TSM Awardable Badge Bg 2 Black White.png"
                alt="TSM Awardable Badge"
                width={300}
                height={300}
                className="h-36 w-auto object-contain"
                priority
              />
            </div>
          </div>

          <div className="relative flex min-h-[620px] items-center justify-center border-t-[3px] border-[#111] bg-white lg:border-t-0">
            <Image
              src="/papyrus-logo.svg"
              alt="Papyrus"
              width={320}
              height={320}
              className="h-48 w-48 object-contain sm:h-64 sm:w-64 lg:h-80 lg:w-80"
              priority
            />
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-[#FAFAF9]">
        <div className="mx-auto max-w-[1440px] px-6 py-12 lg:px-9">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">Deployment alignment</p>
              <h2 className="mt-2 text-3xl font-extrabold tracking-[-0.04em]">Aligned with</h2>
            </div>
            <p className="max-w-xl text-xs font-medium leading-5 text-[#666]">
              Alignment describes supported deployment profiles and documented mappings—not government approval or authorization.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {alignedWith.map((item) => (
              <article key={item.title} className="flex min-h-32 items-center gap-5 border-[3px] border-[#111] bg-white p-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-white p-2">
                  <img src={item.logo} alt="" className="max-h-full max-w-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold">{item.title}</h3>
                  <p className="mt-2 text-xs font-medium leading-5 text-[#666]">{item.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>


      <section className="px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">The workspace</span>
              <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                A control plane for governed agentic collaboration.
              </h2>
            </div>
            <p className="max-w-[390px] text-[15px] font-medium leading-[1.7] text-[#555]">
              Start with a plain-language problem. Papyrus preserves the shared context while
              specialized agents create and refine the work around it.
            </p>
          </div>

          <figure className="border-[3px] border-[#111] bg-white p-2 shadow-[8px_8px_0px_0px_#111] sm:p-3 lg:p-4">
            <iframe
              src="https://player.vimeo.com/video/1227433711?autoplay=1&loop=1&muted=1&playsinline=1&title=0&byline=0&portrait=0"
              title="Papyrus canvas showing product, design, engineering, and security agents around a shared specification"
              className="aspect-video w-full border border-[#d6d3d1]"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <figcaption className="flex flex-col gap-1 px-2 pb-1 pt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-[#666] sm:flex-row sm:items-center sm:justify-between">
              <span>Shared multi-agent canvas</span>
              <span>Product · Design · Engineering · Security</span>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-white px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[.7fr_1.3fr]">
            <div>
              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff5f1f]">
                Specialized agents and tools
              </p>
              <h2 className="mt-5 max-w-[430px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[48px]">
                Customized harnessing for any mission
              </h2>
              <p className="mt-5 max-w-[430px] text-[16px] font-medium leading-[1.72] text-[#555]">
                Use Skills, Tools, and MCP to constrain the agents to the right context, data, and model endpoints for your environment.
              </p>
            </div>

            <div className="grid grid-cols-1 border-l-[3px] border-t-[3px] border-[#111] sm:grid-cols-2">
              {agents.map((agent) => (
                <article
                  key={agent.number}
                  className="border-b-[3px] border-r-[3px] border-[#111] p-7 sm:p-8"
                >
                  <p className="font-mono text-[10px] font-bold tracking-[0.2em] text-[#ff5f1f]">
                    {agent.number} / 04
                  </p>
                  <h3 className="mt-4 text-[24px] font-extrabold tracking-[-0.025em]">
                    {agent.title}
                  </h3>
                  <p className="mt-3 text-[14px] font-medium leading-[1.72] text-[#555]">
                    {agent.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <span className="nb-label mb-6 inline-block">Deployment</span>
            <h2 className="max-w-[600px] text-[40px] font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-[54px]">
              SaaS-grade agents. Never leaves your boundary.
            </h2>
            <p className="mt-6 max-w-[610px] text-[17px] font-medium leading-[1.72] text-[#4a4a4a]">
              Papyrus is self-hosted and designed for environments where collaboration data cannot
              be sent to a public SaaS. Deployment profiles constrain authentication, connectivity,
              and model access for the operating environment.
            </p>
          </div>

          <div className="border-[3px] border-[#111] bg-[#111] p-7 text-[#FAFAF9] shadow-[8px_8px_0px_0px_#ff5f1f] sm:p-9">
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#ff5f1f]">
              Built for controlled environments
            </p>
            <ul className="mt-6">
              {deploymentFacts.map((fact) => (
                <li
                  key={fact}
                  className="flex gap-3 border-t border-[#444] py-4 text-[15px] font-semibold leading-[1.5] last:border-b"
                >
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5f1f]" aria-hidden="true" />
                  {fact}
                </li>
              ))}
            </ul>
            <Link
              href="/trust/papyrus"
              className="mt-7 inline-flex items-center gap-2 border-b-2 border-[#ff5f1f] pb-1 text-[12px] font-extrabold uppercase tracking-[0.08em] text-[#FAFAF9]"
            >
              Inspect the security evidence
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t-[3px] border-[#111] bg-[#ff5f1f] px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em]">
              See it with your workflow
            </p>
            <h2 className="mt-4 max-w-[820px] text-[40px] font-extrabold leading-[1.03] tracking-[-0.045em] sm:text-[56px]">
              Bring a real product problem. Leave with a clearer plan.
            </h2>
          </div>
          <a
            href="mailto:james@beaglabs.com?subject=Papyrus%20demonstration"
            className="nb-btn-white inline-flex shrink-0 items-center gap-2 px-6 py-3.5 text-[12px] uppercase tracking-[0.08em]"
          >
            Request a demonstration
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
