import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowDownToLine,
  BadgeCheck,
  Binary,
  Blocks,
  Bot,
  Check,
  FileJson2,
  Fingerprint,
  KeyRound,
  Network,
  Radar,
  ScrollText,
  ServerCog,
  ShieldCheck,
} from 'lucide-react'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

export const metadata: Metadata = {
  title: 'Papyrus Trust Center',
  description:
    'Security architecture, shared responsibility, supply-chain practices, and OSCAL control documentation for self-hosted Papyrus deployments.',
  alternates: { canonical: '/trust/papyrus' },
}

const controlFamilies = [
  {
    family: 'AC',
    name: 'Access Control',
    controls: ['AC-2', 'AC-3', 'AC-6', 'AC-7', 'AC-12'],
    summary:
      'Account lifecycle, RBAC enforcement, least privilege, login protection, and session termination.',
  },
  {
    family: 'IA',
    name: 'Identification & Authentication',
    controls: ['IA-2', 'IA-4', 'IA-5', 'IA-8'],
    summary: 'CAC/PIV, WebAuthn, OIDC, SAML, identity provenance, and authenticator lifecycle.',
  },
  {
    family: 'AU',
    name: 'Audit & Accountability',
    controls: ['AU-2', 'AU-3', 'AU-6', 'AU-8', 'AU-9', 'AU-12'],
    summary:
      'Event coverage, record content, review, timestamps, integrity protection, and generation.',
  },
  {
    family: 'CM',
    name: 'Configuration Management',
    controls: ['CM-2', 'CM-3', 'CM-5', 'CM-6', 'CM-7', 'CM-8'],
    summary:
      'Deployment baselines, controlled changes, secure settings, least functionality, and inventory.',
  },
  {
    family: 'SC',
    name: 'System & Communications Protection',
    controls: ['SC-7', 'SC-8', 'SC-12', 'SC-13', 'SC-23', 'SC-28'],
    summary:
      'Boundaries, TLS and QUIC, key management, session authenticity, and customer storage encryption.',
  },
  {
    family: 'SI',
    name: 'System & Information Integrity',
    controls: ['SI-2', 'SI-4', 'SI-7', 'SI-10', 'SI-11'],
    summary:
      'Flaw remediation, monitoring, software integrity, input validation, and bounded errors.',
  },
  {
    family: 'RA / SA / SR',
    name: 'Assurance & Supply Chain',
    controls: ['RA-5', 'SA-11', 'SR-4'],
    summary:
      'Vulnerability scanning, developer testing, lockfiles, SBOMs, release evidence, and provenance.',
  },
] as const

const responsibilities = [
  {
    label: 'Papyrus',
    marker: 'P',
    color: 'bg-[#ff5f1f]',
    text: 'Application behavior enforced by Papyrus and evidenced in source, tests, configuration, or audit output.',
  },
  {
    label: 'Shared',
    marker: 'S',
    color: 'bg-[#fff3e6]',
    text: 'Papyrus supplies a mechanism; the customer securely configures, operates, monitors, and assesses it.',
  },
  {
    label: 'Customer',
    marker: 'C',
    color: 'bg-white',
    text: 'Implemented inside the customer boundary: infrastructure, policy, identity lifecycle, storage, and operations.',
  },
  {
    label: 'Inherited',
    marker: 'I',
    color: 'bg-[#111] text-white',
    text: 'Supplied by an authorized platform, operating system, enclave, identity provider, or shared service.',
  },
] as const

const architecture = [
  {
    icon: Fingerprint,
    eyebrow: 'Identity',
    title: 'Profile-gated authentication',
    copy: 'CAC/PIV for SIPRNet/IL6; CAC/PIV and WebAuthn for NIPRNet/IL4; WebAuthn, OIDC, or SAML for commercial deployments. External identities bind to Papyrus member keys with provenance.',
  },
  {
    icon: KeyRound,
    eyebrow: 'Cryptography',
    title: 'Keys stay in the boundary',
    copy: 'Member keys, TLS certificates, IdP verification material, Iroh identities, and license keys remain customer-controlled. FIPS requirements depend on deployed modules—not an algorithm label.',
  },
  {
    icon: ScrollText,
    eyebrow: 'Evidence',
    title: 'Security events with context',
    copy: 'Authentication, roles, project lifecycle, canvas changes, agent actions, peer activity, exports, and administrative operations are designed for auditable, integrity-verifiable records.',
  },
  {
    icon: Network,
    eyebrow: 'Networking',
    title: 'Encrypted peer synchronization',
    copy: 'Iroh and QUIC provide encrypted peer transport. Customers select explicit peers, LAN discovery, or owned/allowlisted relays and retain responsibility for segmentation and cross-domain boundaries.',
  },
  {
    icon: Bot,
    eyebrow: 'Agent safety',
    title: 'Human-reviewed AI work',
    copy: 'Skills and tools are bounded by authorization, endpoint policy, input validation, audit events, execution limits, and human acceptance. Model inference can remain entirely inside the enclave.',
  },
  {
    icon: ServerCog,
    eyebrow: 'Data',
    title: 'Local-first persistence',
    copy: 'Projects, credentials, configuration, and audit information are stored locally. The customer owns host hardening, disk or volume encryption, retention, backup protection, and secure recovery.',
  },
] as const

const evidence = [
  'OSCAL 1.2.1 Component Definition',
  'NIST SP 800-53 Rev. 5 control mappings',
  'SPDX or CycloneDX SBOM',
  'Pinned pnpm dependency graph',
  'Vulnerability and license scans',
  'Authentication and RBAC tests',
  'Audit-event samples and chain verification',
  'Release hashes and build provenance',
  'Secure configuration guidance',
  'Shared-responsibility matrix',
  'Backup and recovery procedure',
  'Supported-version and remediation policy',
] as const

const technologies = [
  { name: 'NIST', domain: 'nist.gov', subtitle: 'OSCAL + SP 800-53' },
  { name: 'FIDO Alliance', domain: 'fidoalliance.org', subtitle: 'WebAuthn / passkeys' },
  { name: 'OpenID', domain: 'openid.net', subtitle: 'Federated identity' },
  { name: 'Iroh', domain: 'iroh.computer', subtitle: 'Encrypted QUIC mesh' },
  { name: 'SQLite', domain: 'sqlite.org', subtitle: 'Local persistence' },
  { name: 'Node.js', domain: 'nodejs.org', subtitle: 'Self-hosted runtime' },
] as const

function Label({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span
      className={`inline-flex border-2 border-[#111] px-3 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] ${
        dark ? 'bg-[#111] text-white' : 'bg-[#ff5f1f] text-[#111]'
      }`}
    >
      {children}
    </span>
  )
}

export default function PapyrusTrustCenter() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <section className="relative border-b-[3px] border-[#111] px-6 pb-16 pt-32 lg:px-9 lg:pb-24 lg:pt-40">
        <div className="pointer-events-none absolute right-[-7rem] top-20 hidden h-72 w-72 rotate-6 border-[3px] border-[#111] bg-[#ff5f1f] shadow-[12px_12px_0_#111] lg:block" />
        <div className="relative mx-auto grid max-w-[1440px] gap-12 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
          <div>
            <Label>Papyrus / Trust Center</Label>
            <h1 className="mt-7 max-w-5xl text-[clamp(3.6rem,8vw,8.6rem)] font-black leading-[0.82] tracking-[-0.075em]">
              Trust should be
              <span className="block text-[#ff5f1f] [-webkit-text-stroke:3px_#111]">
                inspectable.
              </span>
            </h1>
            <p className="mt-8 max-w-3xl text-lg font-medium leading-8 text-[#444] lg:text-xl">
              Papyrus is a self-hosted product-development canvas built for regulated and
              disconnected environments. This center explains the mechanisms, evidence, and customer
              responsibilities behind that design—without presenting a certification we have not
              earned.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="/compliance/papyrus-component-definition.json"
                download
                className="nb-btn-orange inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]"
              >
                <ArrowDownToLine className="h-4 w-4" />
                Download OSCAL JSON
              </a>
              <a
                href="https://github.com/beaglabs/papyrus"
                target="_blank"
                rel="noreferrer"
                className="nb-btn-white inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]"
              >
                <Binary className="h-4 w-4" />
                Inspect repository
              </a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2.25rem] border-[3px] border-[#111] bg-[#111]" />
            <div className="relative rounded-[2.25rem] border-[3px] border-[#111] bg-white p-8">
              <img
                src="/papyrus-logo.svg"
                alt="Papyrus orange parchment logo"
                className="mx-auto aspect-square w-full max-w-[300px] object-contain"
              />
              <div className="mt-3 border-t-[3px] border-[#111] pt-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#777]">
                      Artifact
                    </p>
                    <p className="mt-1 text-2xl font-black">35 controls</p>
                  </div>
                  <BadgeCheck className="h-12 w-12 text-[#ff5f1f]" strokeWidth={2.5} />
                </div>
                <p className="mt-4 text-sm font-medium leading-6 text-[#555]">
                  OSCAL Component Definition · NIST SP 800-53 Rev. 5 · version 0.1.0
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b-[3px] border-[#111] bg-[#111] px-6 py-5 text-white lg:px-9">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em]">
            Self-hosted · Local-first · Customer-owned boundary
          </p>
          <p className="font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#ff5f1f]">
            No FedRAMP or ATO claim
          </p>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
            <div>
              <Label dark>Security architecture</Label>
              <h2 className="mt-6 text-5xl font-black leading-[0.92] tracking-[-0.055em] lg:text-7xl">
                Designed for the boundary you own.
              </h2>
              <p className="mt-6 max-w-xl text-base font-medium leading-7 text-[#555]">
                Papyrus contributes application controls. Your organization supplies the authorized
                infrastructure, identity lifecycle, cryptographic modules, operations, monitoring,
                and assessment around them.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {architecture.map(({ icon: Icon, eyebrow, title, copy }) => (
                <article key={title} className="nb-card bg-white p-6">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-mono text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#ff5f1f]">
                      {eyebrow}
                    </p>
                    <Icon className="h-6 w-6" strokeWidth={2.4} />
                  </div>
                  <h3 className="mt-5 text-xl font-black tracking-[-0.025em]">{title}</h3>
                  <p className="mt-3 text-sm font-medium leading-6 text-[#555]">{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-[#fff3e6] px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <Label>OSCAL / Rev. 5</Label>
              <h2 className="mt-6 text-5xl font-black tracking-[-0.055em] lg:text-7xl">
                Control coverage
              </h2>
            </div>
            <p className="max-w-2xl text-base font-medium leading-7 text-[#555]">
              Selected controls where software-level documentation is useful. Statements describe
              potential contributions and must be tailored and assessed inside the deployed system.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            {controlFamilies.map((group, index) => (
              <article
                key={group.family}
                className={`border-[3px] border-[#111] bg-white p-6 shadow-[6px_6px_0_#111] ${
                  index === controlFamilies.length - 1 ? 'lg:col-span-2' : ''
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5f1f]">
                      Family {group.family}
                    </p>
                    <h3 className="mt-2 text-2xl font-black">{group.name}</h3>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {group.controls.map((control) => (
                      <span
                        key={control}
                        className="border-2 border-[#111] bg-[#FAFAF9] px-2.5 py-1 font-mono text-[10px] font-black"
                      >
                        {control}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="mt-5 border-t-2 border-[#111] pt-4 text-sm font-medium leading-6 text-[#555]">
                  {group.summary}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto grid max-w-[1440px] gap-14 lg:grid-cols-2">
          <div>
            <Label dark>Shared responsibility</Label>
            <h2 className="mt-6 text-5xl font-black leading-[0.94] tracking-[-0.055em] lg:text-7xl">
              A component is not a boundary.
            </h2>
            <p className="mt-6 text-base font-medium leading-7 text-[#555]">
              Every OSCAL statement is labeled by responsibility so an authorizing team can see what
              Papyrus provides, what must be configured, and what is inherited from the deployment.
            </p>
            <div className="mt-9 space-y-4">
              {responsibilities.map((item) => (
                <div
                  key={item.label}
                  className="flex gap-4 border-[3px] border-[#111] bg-white p-4"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center border-2 border-[#111] font-mono text-sm font-black ${item.color}`}
                  >
                    {item.marker}
                  </span>
                  <div>
                    <h3 className="font-black">{item.label}</h3>
                    <p className="mt-1 text-sm font-medium leading-6 text-[#555]">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-[3px] border-[#111] bg-[#111] p-7 text-white shadow-[10px_10px_0_#ff5f1f] lg:p-10">
            <div className="flex items-center justify-between gap-5 border-b-2 border-white/30 pb-6">
              <div>
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5f1f]">
                  Evidence package
                </p>
                <h3 className="mt-2 text-3xl font-black">What customers can request</h3>
              </div>
              <FileJson2 className="h-10 w-10 text-[#ff5f1f]" />
            </div>
            <ul className="mt-7 grid gap-3 sm:grid-cols-2">
              {evidence.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm font-semibold leading-6">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-[#ff5f1f]" strokeWidth={3} />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-2 border-[#ff5f1f] bg-[#1b1b1b] p-5">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5f1f]">
                Important
              </p>
              <p className="mt-2 text-sm font-medium leading-6 text-white/75">
                Evidence availability evolves with the product. The OSCAL file is a maintained
                implementation artifact, not an independent assessment or guarantee of control
                effectiveness.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-[#111] bg-white px-6 py-20 lg:px-9">
        <div className="mx-auto max-w-[1440px]">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <Label>Standards + foundations</Label>
              <h2 className="mt-5 text-4xl font-black tracking-[-0.045em] lg:text-6xl">
                Built from inspectable parts.
              </h2>
            </div>
            <p className="max-w-xl text-sm font-medium leading-6 text-[#555]">
              These marks identify standards bodies and technical foundations—not endorsements,
              certifications, or partnerships.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {technologies.map((technology) => (
              <div
                key={technology.name}
                className="flex items-center gap-4 border-[3px] border-[#111] bg-[#FAFAF9] p-5 shadow-[4px_4px_0_#111]"
              >
                <div className="flex h-14 w-14 items-center justify-center border-2 border-[#111] bg-white p-2">
                  <img
                    src={`https://img.logo.dev/${technology.domain}?format=png&size=96`}
                    alt=""
                    loading="lazy"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <p className="font-black">{technology.name}</p>
                  <p className="mt-1 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#777]">
                    {technology.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20 lg:px-9 lg:py-28">
        <div className="mx-auto max-w-[1440px]">
          <div className="relative overflow-hidden border-[3px] border-[#111] bg-[#ff5f1f] p-8 shadow-[10px_10px_0_#111] lg:p-14">
            <ShieldCheck
              className="absolute -bottom-14 -right-8 h-64 w-64 text-[#111]/10"
              strokeWidth={1.5}
            />
            <div className="relative max-w-4xl">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em]">
                Authorization support
              </p>
              <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-[-0.05em] lg:text-7xl">
                Bring Papyrus into your SSP—not the other way around.
              </h2>
              <p className="mt-6 max-w-3xl text-base font-semibold leading-7">
                Import the Component Definition, instantiate it in the real architecture, tailor the
                shared statements, add inherited controls and evidence, then assess the deployed
                system.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <a
                  href="/compliance/papyrus-component-definition.json"
                  download
                  className="nb-btn-white inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.12em]"
                >
                  <Blocks className="h-4 w-4" />
                  Get the component definition
                </a>
                <Link
                  href="mailto:james@beaglabs.com?subject=Papyrus%20security%20review"
                  className="nb-btn inline-flex items-center gap-2 bg-[#111] px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-white"
                >
                  <Radar className="h-4 w-4" />
                  Request evidence
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
