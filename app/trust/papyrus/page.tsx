import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  ArrowUpRight,
  Check,
  Download,
  FileJson2,
  FileText,
  Github,
  ShieldCheck,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Papyrus Trust Center',
  description:
    'Machine-readable security controls, software bill of materials, and third-party license reporting for Papyrus.',
  alternates: { canonical: '/trust/papyrus' },
}

type BomComponent = {
  name: string
  version?: string
  purl?: string
  licenses?: Array<{ license?: { id?: string }; expression?: string }>
  externalReferences?: Array<{ type?: string; url?: string }>
  manufacturer?: { url?: string[] }
}

type Bom = {
  specVersion: string
  metadata?: { timestamp?: string }
  components?: BomComponent[]
}

type OscalRequirement = {
  'control-id': string
  description: string
  props?: Array<{ name: string; value: string }>
}

type Oscal = {
  'component-definition': {
    metadata: {
      title: string
      version: string
      'oscal-version': string
      'last-modified': string
      remarks: string
    }
    components: Array<{
      title: string
      description: string
      props?: Array<{ name: string; value: string }>
      'control-implementations'?: Array<{
        'implemented-requirements'?: OscalRequirement[]
      }>
    }>
  }
}

const compliancePath = path.join(process.cwd(), 'public', 'compliance')
const bom = JSON.parse(readFileSync(path.join(compliancePath, 'cyclonedx.sbom.json'), 'utf8')) as Bom
const oscal = JSON.parse(
  readFileSync(path.join(compliancePath, 'papyrus-component-definition.json'), 'utf8'),
) as Oscal

const definition = oscal['component-definition']
const product = definition.components[0]
const requirements = product['control-implementations']?.flatMap(
  (implementation) => implementation['implemented-requirements'] ?? [],
) ?? []

const getVersion = (component: BomComponent) => {
  if (component.version) return component.version
  const match = component.purl?.match(/@([^@?]+)(?:\?|$)/)
  return match?.[1] ? decodeURIComponent(match[1]) : 'Unspecified'
}

const normalizeProjectUrl = (url?: string) => {
  if (!url) return undefined
  return url
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/\.git$/, '')
}

const getProjectUrl = (component: BomComponent) => {
  const repository = component.externalReferences?.find((reference) =>
    ['vcs', 'website', 'distribution'].includes(reference.type ?? ''),
  )?.url
  const known = normalizeProjectUrl(repository ?? component.manufacturer?.url?.[0])
  if (known) return known
  return `https://www.npmjs.com/package/${encodeURIComponent(component.name)}`
}

const getLogoUrl = (projectUrl: string) => {
  const github = projectUrl.match(/github\.com\/([^/]+)/i)
  if (github?.[1]) return `https://github.com/${github[1]}.png?size=96`
  try {
    const domain = new URL(projectUrl).hostname
    return `https://img.logo.dev/${domain}?format=png&size=96`
  } catch {
    return 'https://img.logo.dev/npmjs.com?format=png&size=96'
  }
}

const getLicenses = (component: BomComponent) => {
  const licenses = component.licenses
    ?.map((entry) => entry.license?.id ?? entry.expression)
    .filter(Boolean)
  return licenses?.length ? [...new Set(licenses)].join(' + ') : 'Not declared'
}

const components = (bom.components ?? []).map((component) => {
  const projectUrl = getProjectUrl(component)
  return {
    ...component,
    projectUrl,
    logoUrl: getLogoUrl(projectUrl),
    displayVersion: getVersion(component),
    displayLicenses: getLicenses(component),
  }
})

const licenseCounts = components.reduce<Record<string, number>>((counts, component) => {
  const license = component.displayLicenses
  counts[license] = (counts[license] ?? 0) + 1
  return counts
}, {})

const primaryLicenses = Object.entries(licenseCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 4)

const responsibilityCounts = requirements.reduce<Record<string, number>>((counts, requirement) => {
  const owner = requirement.props?.find((prop) => prop.name === 'responsibility')?.value ?? 'unspecified'
  counts[owner] = (counts[owner] ?? 0) + 1
  return counts
}, {})

const artifacts = [
  {
    title: 'OSCAL component definition',
    detail: `OSCAL ${definition.metadata['oscal-version']} · v${definition.metadata.version}`,
    href: '/compliance/papyrus-component-definition.json',
    source:
      'https://github.com/beaglabs/papyrus/blob/main/compliance/papyrus-component-definition.json',
    icon: FileJson2,
  },
  {
    title: 'CycloneDX SBOM',
    detail: `CycloneDX ${bom.specVersion} · ${components.length} components`,
    href: '/compliance/cyclonedx.sbom.json',
    source: 'https://github.com/beaglabs/papyrus/blob/main/compliance/cyclonedx.sbom.json',
    icon: ShieldCheck,
  },
  {
    title: 'FOSSA third-party report',
    detail: 'Dependency licenses and notices · PDF',
    href:
      'https://github.com/beaglabs/papyrus/raw/refs/heads/main/compliance/third-party-software-report.pdf',
    source:
      'https://github.com/beaglabs/papyrus/blob/main/compliance/third-party-software-report.pdf',
    icon: FileText,
  },
] as const

export default function PapyrusTrustCenter() {
  return (
    <main className="min-h-screen bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <section className="border-b-[3px] border-[#111] pt-16">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-28">
          <span className="nb-label mb-6 inline-block">Papyrus / Trust Center</span>
          <div className="grid gap-12 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
            <div>
              <h1 className="max-w-[900px] text-[52px] font-extrabold leading-[1.02] tracking-[-0.055em] sm:text-[64px] lg:text-[80px]">
                Security evidence,
                <span className="block text-[#ff5f1f]">published in the open.</span>
              </h1>
              <p className="mt-7 max-w-[760px] text-[18px] font-medium leading-[1.65] text-[#404040]">
                Papyrus is self-hosted software for regulated and disconnected environments. This
                page is generated from the product&apos;s published OSCAL and CycloneDX artifacts and
                links directly to the underlying evidence.
              </p>
            </div>
            <div className="border-l-[3px] border-[#111] pl-6 lg:pl-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
                Scope note
              </p>
              <p className="mt-3 text-sm font-semibold leading-6 text-[#444]">
                These artifacts document potential software control contributions. They are not a
                FedRAMP authorization, an ATO, an SSP, or an independent assessment.
              </p>
              <a
                href="https://github.com/beaglabs/papyrus"
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.08em] underline decoration-2 underline-offset-4"
              >
                <Github className="h-4 w-4" /> Inspect the repository
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-white">
        <div className="mx-auto grid max-w-[1440px] divide-y-[3px] divide-[#111] lg:grid-cols-3 lg:divide-x-[3px] lg:divide-y-0">
          {artifacts.map(({ title, detail, href, source, icon: Icon }) => (
            <article key={title} className="p-6 lg:p-8">
              <div className="flex items-start justify-between gap-5">
                <Icon className="h-7 w-7 text-[#ff5f1f]" strokeWidth={2.2} />
                <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[#777]">
                  Published artifact
                </span>
              </div>
              <h2 className="mt-8 text-xl font-extrabold tracking-[-0.025em]">{title}</h2>
              <p className="mt-2 text-sm font-medium text-[#555]">{detail}</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <a
                  href={href}
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em]"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <a
                  href={source}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#555]"
                >
                  Source <ArrowUpRight className="h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-[#111] text-white">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 divide-x divide-white/20 lg:grid-cols-4">
          {[
            ['Components', String(components.length)],
            ['Mapped controls', String(requirements.length)],
            ['OSCAL version', definition.metadata['oscal-version']],
            ['SBOM generated', new Date(bom.metadata?.timestamp ?? '').toLocaleDateString('en-US')],
          ].map(([label, value]) => (
            <div key={label} className="px-6 py-7 lg:px-9">
              <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/55">{label}</p>
              <p className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#ff5f1f]">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b-[3px] border-[#111]">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr]">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
                Machine-readable controls
              </p>
              <h2 className="mt-4 text-4xl font-extrabold leading-[1.02] tracking-[-0.05em] lg:text-6xl">
                The model is explicit about ownership.
              </h2>
              <p className="mt-6 text-base font-medium leading-7 text-[#555]">
                The OSCAL component definition separates behavior provided by Papyrus from
                configuration, infrastructure, and inherited services owned by the customer.
              </p>
            </div>
            <div>
              <div className="grid grid-cols-2 border-[3px] border-[#111] bg-white sm:grid-cols-4">
                {['papyrus', 'shared', 'customer', 'inherited'].map((owner, index) => (
                  <div
                    key={owner}
                    className={`p-5 ${index ? 'border-l-[3px] border-[#111]' : ''}`}
                  >
                    <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#777]">{owner}</p>
                    <p className="mt-2 text-3xl font-extrabold">{responsibilityCounts[owner] ?? 0}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {requirements.map((requirement) => (
                  <a
                    key={requirement['control-id']}
                    href={`https://csf.tools/reference/nist-sp-800-53/r5/${requirement['control-id'].split('-')[0]}/${requirement['control-id']}/`}
                    target="_blank"
                    rel="noreferrer"
                    title={requirement.description}
                    className="border-2 border-[#111] bg-white px-3 py-2 font-mono text-[10px] font-bold uppercase hover:bg-[#fff3e6]"
                  >
                    {requirement['control-id']}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-white">
        <div className="mx-auto max-w-[1440px] px-6 py-20 lg:px-9 lg:py-24">
          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
                Software bill of materials
              </p>
              <h2 className="mt-4 text-4xl font-extrabold tracking-[-0.05em] lg:text-6xl">
                {components.length} inspectable components.
              </h2>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#555]">
              {primaryLicenses.map(([license, count]) => (
                <span key={license}>
                  <strong className="text-[#111]">{count}</strong> {license}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-10 overflow-hidden border-[3px] border-[#111]">
            <div className="hidden grid-cols-[minmax(0,1.5fr)_140px_180px_36px] gap-5 border-b-[3px] border-[#111] bg-[#FAFAF9] px-5 py-3 font-mono text-[9px] font-bold uppercase tracking-[0.16em] text-[#666] md:grid">
              <span>Component</span>
              <span>Version</span>
              <span>License</span>
              <span />
            </div>
            <ol className="divide-y-2 divide-[#111]">
              {components.map((component) => (
                <li key={component.purl ?? `${component.name}-${component.displayVersion}`}>
                  <a
                    href={component.projectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group grid gap-4 bg-white px-5 py-4 transition-colors hover:bg-[#fff3e6] md:grid-cols-[minmax(0,1.5fr)_140px_180px_36px] md:items-center md:gap-5"
                  >
                    <span className="flex min-w-0 items-center gap-4">
                      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden border-2 border-[#111] bg-white font-mono text-xs font-black uppercase">
                        {component.name.slice(0, 1)}
                        <img
                          src={component.logoUrl}
                          alt=""
                          loading="lazy"
                          className="absolute inset-0 h-full w-full bg-white object-contain p-1"
                        />
                      </span>
                      <span className="min-w-0 truncate font-extrabold tracking-[-0.015em]">
                        {component.name}
                      </span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold text-[#555]">
                      {component.displayVersion}
                    </span>
                    <span className="text-xs font-bold text-[#555]">{component.displayLicenses}</span>
                    <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </a>
                </li>
              ))}
            </ol>
          </div>

          <p className="mt-5 max-w-3xl text-xs font-medium leading-5 text-[#666]">
            Component names, versions, and declared licenses are read from the published CycloneDX
            SBOM. Project links are taken from each component&apos;s repository metadata, with npm as the
            fallback. Marks identify their respective projects or maintainers and do not imply
            endorsement.
          </p>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-9 lg:py-24">
        <div className="mx-auto grid max-w-[1440px] gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ff5f1f]">
              Need deployment evidence?
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.04] tracking-[-0.05em] lg:text-6xl">
              Map the component into your actual authorization boundary.
            </h2>
          </div>
          <a
            href="mailto:james@beaglabs.com?subject=Papyrus%20security%20review"
            className="nb-btn-orange inline-flex items-center justify-center gap-2 px-6 py-4 text-xs uppercase tracking-[0.1em]"
          >
            Request evidence <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
