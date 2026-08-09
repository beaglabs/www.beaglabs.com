import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'

import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = pageMetadata({
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

const agents = [
  {
    number: '01',
    title: 'Product',
    description:
      'Turns a mission problem into a structured product vision, requirements, user stories, and measurable outcomes.',
  },
  {
    number: '02',
    title: 'Design',
    description:
      'Helps teams shape workflows and interfaces around the people who will actually use the system.',
  },
  {
    number: '03',
    title: 'Engineering',
    description:
      'Translates decisions into technical direction, implementation tasks, interfaces, and delivery-ready detail.',
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

export default function PapyrusProductPage() {
  return (
    <main className="bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <section className="overflow-hidden border-b-[3px] border-[#111] pt-16">
        <div className="mx-auto grid max-w-[1440px] grid-cols-1 lg:grid-cols-[1.05fr_.95fr]">
          <div className="flex min-h-[620px] flex-col justify-center px-6 py-20 lg:border-r-[3px] lg:border-[#111] lg:px-9 lg:py-24">
            <div className="mb-10 flex items-center gap-4">
              <Image
                src="/papyrus-logo.svg"
                alt="Papyrus"
                width={72}
                height={72}
                className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px]"
                priority
              />
              <div>
                <p className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#ff5f1f]">
                  Beag Labs product
                </p>
                <p className="mt-1 text-[24px] font-extrabold tracking-[0.12em]">PAPYRUS</p>
              </div>
            </div>

            <h1 className="max-w-[720px] text-[52px] font-extrabold leading-[.98] tracking-[-0.055em] sm:text-[66px] lg:text-[78px]">
              Turn mission needs into build-ready plans.
            </h1>
            <p className="mt-7 max-w-[650px] text-[18px] font-medium leading-[1.7] text-[#444]">
              Papyrus is a self-hosted, multi-agent product workspace. Product, design,
              engineering, and security agents work from the same canvas to help teams move
              from an early idea to clear, traceable delivery artifacts.
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
          </div>

          <div className="relative min-h-[620px] border-t-[3px] border-[#111] lg:border-t-0">
            <Image
              src="https://images.pexels.com/photos/31888836/pexels-photo-31888836.jpeg"
              alt="Papyrus"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <span className="nb-label mb-5 inline-block">The workspace</span>
              <h2 className="max-w-[760px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[52px]">
                A canvas for the whole product conversation.
              </h2>
            </div>
            <p className="max-w-[390px] text-[15px] font-medium leading-[1.7] text-[#555]">
              Start with a plain-language problem. Papyrus preserves the shared context while
              specialized agents create and refine the work around it.
            </p>
          </div>

          <figure className="border-[3px] border-[#111] bg-white p-2 shadow-[8px_8px_0px_0px_#111] sm:p-3 lg:p-4">
            <Image
              src="/products/papyrus-workspace.png"
              alt="Papyrus canvas showing product, design, engineering, and security agents around a shared specification"
              width={2047}
              height={1167}
              className="h-auto w-full border border-[#d6d3d1]"
              sizes="(max-width: 1440px) 94vw, 1370px"
              priority
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
                Specialized agents
              </p>
              <h2 className="mt-5 max-w-[430px] text-[38px] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[48px]">
                One context. Four disciplines.
              </h2>
              <p className="mt-5 max-w-[430px] text-[16px] font-medium leading-[1.72] text-[#555]">
                Bring the disciplines into the work early without requiring another disconnected
                document, meeting, or tool for every perspective.
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
              Your environment. Your data. Your model endpoint.
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
