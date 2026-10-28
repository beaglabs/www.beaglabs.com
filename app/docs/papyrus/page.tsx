import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Papyrus Developer Documentation',
  description: 'Verified Papyrus YAML configuration, deployment behavior, authentication, and OpenAPI reference.',
  alternates: { canonical: '/docs/papyrus' },
}

const sections = [
  ['overview', 'Overview'],
  ['configuration', 'Configuration'],
  ['schema', 'Schema & validation'],
  ['api', 'API reference'],
  ['authentication', 'Authentication'],
  ['operations', 'Endpoint examples'],
  ['deployment', 'Deployment'],
] as const

const settings = [
  ['version', '1', 'Configuration format version; required.'],
  ['server.mode', 'local | persistent', 'Runtime persistence mode.'],
  ['server.profile', 'commercial | government | disconnected', 'Deployment policy profile.'],
  ['server.host / server.port', 'string / 1–65535', 'Listener binding.'],
  ['server.publicOrigin', 'URI', 'Authoritative public origin.'],
  ['identity.entra.cloud', 'Public | USGov | USGovDoD', 'Microsoft identity cloud.'],
  ['models.default', 'gateway ID', 'Gateway selected for new sessions.'],
  ['models.gateways[]', 'array', 'Customer-controlled inference gateway definitions.'],
  ['agents.limits.*', 'numbers', 'Execution and concurrency budgets.'],
  ['egress.allowedHosts', 'host patterns', 'Outbound destination policy.'],
  ['directory.scim.token', 'secret reference', 'SCIM bearer credential.'],
  ['secrets.portalSecret', 'secret reference', 'Portal session secret.'],
] as const

const endpoints = [
  ['GET', '/api/v1/openapi.json', 'Caller-scoped OpenAPI 3.1 document'],
  ['GET', '/api/v1/workflows', 'List visible workflows'],
  ['POST', '/api/v1/workflows', 'Create a workflow draft'],
  ['POST', '/api/v1/workflows/validate', 'Validate a workflow definition'],
  ['GET', '/api/agent-roster', 'List governed agents'],
  ['GET', '/api/configuration', 'Read effective configuration evidence (authorized roles)'],
  ['GET', '/api/me', 'Read the signed-in principal'],
] as const

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl border border-[#263244] bg-[#111a28] p-5 font-mono text-[12px] leading-7 text-[#e1ebf5] shadow-[0_14px_35px_rgba(22,30,47,.1)]"><code>{children}</code></pre>
}

function Section({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-28 border-t border-[#e2e7ed] py-12">
    <p className="font-mono text-[10px] font-bold uppercase tracking-[.15em] text-[#5e75a1]">{eyebrow}</p>
    <h2 className="mt-2 text-3xl font-semibold tracking-[-.045em] text-[#151b25] sm:text-4xl">{title}</h2>
    <div className="mt-6 space-y-5 text-[15px] leading-8 text-[#536071]">{children}</div>
  </section>
}

export default function PapyrusDocs() {
  return <main className="min-h-screen bg-[#fbfcfd] pt-24 text-[#1b2430]">
    <div className="mx-auto grid max-w-[1460px] grid-cols-1 gap-0 px-5 pb-24 lg:grid-cols-[245px_minmax(0,1fr)_200px] lg:gap-12 lg:px-8">
      <aside className="hidden lg:block">
        <div className="sticky top-28 space-y-7">
          <div className="border-b border-[#e2e7ed] pb-6">
            <Link href="/products/papyrus" className="font-mono text-[11px] font-semibold uppercase tracking-widest text-[#748197] hover:text-[#f15c24]">← Papyrus</Link>
            <p className="mt-4 text-lg font-bold tracking-tight">Developer docs</p>
            <p className="mt-1 text-xs text-[#7b8798]">Configuration & API</p>
          </div>
          <nav aria-label="Documentation sections" className="flex flex-col gap-1">
            {sections.map(([id, label]) => <a key={id} href={`#${id}`} className="rounded-md px-3 py-2 text-[13px] font-medium text-[#677386] transition hover:bg-[#eef2f8] hover:text-[#233b75]">{label}</a>)}
          </nav>
        </div>
      </aside>
      <article className="min-w-0 max-w-[850px]">
        <header id="overview" className="relative scroll-mt-28 overflow-hidden rounded-2xl border border-[#e1e6ef] bg-white px-6 py-12 sm:px-12 sm:py-16">
          <div className="pointer-events-none absolute inset-0 opacity-60" style={{backgroundImage:'radial-gradient(#d5ddeb 0.75px, transparent 0.75px)',backgroundSize:'17px 17px',maskImage:'linear-gradient(90deg,transparent 20%,black)'}} />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded bg-[#111b29] px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">Papyrus / Docs</span>
              <span className="font-mono text-[11px] text-[#7b8798]">Verified against Papyrus source · October 2026</span>
            </div>
            <h1 className="mt-7 text-[clamp(2.7rem,5.5vw,5.2rem)] font-semibold leading-[1.06] tracking-[-.065em]">Build inside<br />your boundary<span className="text-[#ef5b2b]">.</span></h1>
            <p className="mt-7 max-w-[620px] text-lg leading-8 text-[#687587]">A practical reference for Papyrus configuration, governed workflows, identity, and deployment-specific API access.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <a href="#configuration" className="rounded-lg bg-[#182338] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#324467]">Configure Papyrus ↓</a>
              <a href="#api" className="rounded-lg border border-[#cfd7e4] bg-white px-4 py-2.5 text-sm font-semibold text-[#24344d] hover:bg-[#f1f5fb]">Explore the API ↓</a>
            </div>
          </div>
        </header>
        <div className="mt-7 rounded-lg border-l-[3px] border-[#ed9e3c] bg-[#fff8ea] px-5 py-4 text-[13px] leading-6 text-[#785b28]">
          <strong>Deployment-scoped reference.</strong> Papyrus generates an OpenAPI document for each authenticated caller. The operations and workflows visible to an API key can differ from those visible to a signed-in administrator. The documentation site does not connect to customer environments.
        </div>
        <Section id="configuration" eyebrow="01 / Runtime" title="Configuration">
          <p>Papyrus reads one optional <code>papyrus.yaml</code> file alongside <code>PAPYRUS_*</code> environment variables. It locates configuration in this order:</p>
          <ol className="list-decimal space-y-1 pl-6"><li><code>PAPYRUS_CONFIG_FILE</code> (explicit path; a missing file fails startup)</li><li><code>/etc/papyrus/papyrus.yaml</code></li><li><code>./papyrus.yaml</code> in the working directory</li></ol>
          <p>Precedence is <strong className="text-[#253047]">built-in defaults → YAML file → environment</strong>. Environment variables override the corresponding YAML values. An absent YAML file is supported.</p>
          <Code>{`# Extract from the source-backed example; replace placeholders.
version: 1
server:
  mode: persistent
  profile: commercial
models:
  default: local
  gateways:
    - id: local
      kind: openai-compatible
      baseUrl: http://localhost:8000/v1
      model: qwen3-32b
secrets:
  portalSecret: { file: /run/secrets/papyrus-portal-secret }`}</Code>
          <div className="flex flex-wrap gap-3 text-sm font-semibold"><a className="text-[#254eab] underline underline-offset-4" href="/docs/papyrus/papyrus.example.yaml" download>Download annotated YAML</a><a className="text-[#254eab] underline underline-offset-4" href="/docs/papyrus/papyrus.config.schema.json" download>Download JSON Schema</a></div>
        </Section>
        <Section id="schema" eyebrow="02 / Validation" title="Typed, inspectable settings">
          <p>Unknown properties, invalid types, and out-of-range values fail validation. Secrets must use <code>{'{ file: ... }'}</code> or <code>{'{ env: ... }'}</code> references, never inline strings. Relative secret file paths resolve relative to the configuration file.</p>
          <div className="overflow-x-auto rounded-xl border border-[#e0e6ee] bg-white"><table className="w-full min-w-[540px] text-left text-[13px]"><thead className="bg-[#f4f7fa] text-[#334155]"><tr><th className="px-4 py-3">YAML property</th><th className="px-4 py-3">Type / values</th><th className="px-4 py-3">Purpose</th></tr></thead><tbody>{settings.map(([key, type, purpose])=><tr key={key} className="border-t border-[#ebeff3]"><td className="px-4 py-3 font-mono text-[12px] text-[#2b4d88]">{key}</td><td className="px-4 py-3">{type}</td><td className="px-4 py-3">{purpose}</td></tr>)}</tbody></table></div>
          <p>The full schema contains additional identity, audit, package mirror, session, signing, channel, and egress settings. The downloadable JSON Schema is the complete field-level reference.</p>
          <Code>{`# Run from the Papyrus application checkout after building:
node apps/server/dist/index.js --check-config`}</Code>
          <p>This command reports effective setting sources, overrides, and validation errors without starting the service. Startup also records a configuration digest and change evidence; authorized System Owners and Audit Viewers can inspect it through <code>GET /api/configuration</code>.</p>
        </Section>
        <Section id="api" eyebrow="03 / OpenAPI 3.1" title="API reference">
          <p>The authoritative specification is generated by the running Papyrus server at <code>GET /api/v1/openapi.json</code>. It is not a universal static file: it includes caller-available workflows, and a signed-in person's document additionally includes the general route reference.</p>
          <Code>{`# Use your own Papyrus deployment and an API key authorized
# for the relevant workflows. Keep the token out of shell history.
curl -H "Authorization: Bearer <pap_key_token>" \\
  https://<your-papyrus-origin>/api/v1/openapi.json`}</Code>
          <p>Import the resulting OpenAPI 3.1 document into a Scalar API Reference instance to browse schemas and run permitted operations. For the comprehensive portal reference, retrieve the spec with an authenticated portal session inside the trusted deployment boundary. Avoid uploading customer-specific workflow definitions or internal origins to public documentation services.</p>
          <div className="rounded-xl border border-[#d9e1ec] bg-[#f3f6fb] px-5 py-5 text-sm"><strong className="text-[#293c61]">Scalar integration pattern</strong><p className="mt-2">Point Scalar at your deployment's authenticated OpenAPI URL. Host the API explorer inside the same trusted boundary; the public Beag Labs site intentionally does not proxy tokens or private schemas.</p></div>
        </Section>
        <Section id="authentication" eyebrow="04 / Authorization" title="Identity and scopes">
          <p>Public API operations declare their supported credentials: a portal session cookie, a workflow-scoped bearer API key, a request signature, or SCIM bearer authentication. API keys are issued through Papyrus Settings and are limited to specified published workflows. Many management and agent roster routes require a human portal session and role checks.</p>
          <ul className="list-disc space-y-1 pl-6"><li>Portal sessions use an HTTP-only cookie (<code>__Host-papyrus_portal</code> on secure deployments).</li><li>API keys use <code>Authorization: Bearer pap_key_…</code>.</li><li>Server-side approval, role checks, origin restrictions, and audit enforcement remain authoritative.</li><li>SCIM has a separate identity-provider bearer token configured with <code>directory.scim.token</code>.</li></ul>
        </Section>
        <Section id="operations" eyebrow="05 / Selected routes" title="Endpoint examples">
          <p>These routes are present in the Papyrus source-owned API reference. This is a curated index, not an exhaustive copy of the caller-scoped OpenAPI document.</p>
          <div className="overflow-hidden rounded-xl border border-[#e1e6ed] bg-white">{endpoints.map(([method,path,description])=><div key={path+method} className="flex flex-col gap-2 border-b border-[#e9edf2] px-4 py-4 last:border-0 sm:flex-row sm:items-center sm:gap-4"><div className="flex min-w-0 items-center gap-3"><span className={`w-[54px] shrink-0 rounded px-2 py-1 text-center font-mono text-[10px] font-bold ${method==='GET'?'bg-[#e8f6f0] text-[#15774e]':'bg-[#e9edff] text-[#3656b1]'}`}>{method}</span><code className="break-all font-mono text-[12px] font-semibold text-[#293956]">{path}</code></div><span className="text-[12px] text-[#7a8798] sm:ml-auto sm:max-w-[210px]">{description}</span></div>)}</div>
        </Section>
        <Section id="deployment" eyebrow="06 / Operations" title="Deploy with evidence">
          <p>Configuration can be version controlled and reviewed without storing secret values. Papyrus exposes configuration provenance, server-side audit events, offline licensing, and profile controls; customers remain responsible for authorized networks, identity configuration, approved cryptography, model endpoints, storage protection, and operational accreditation.</p>
          <ul className="list-disc space-y-1 pl-6"><li>Pin the application release and config schema version.</li><li>Validate <code>papyrus.yaml</code> with <code>--check-config</code> before startup.</li><li>Keep model gateways and integration credentials within approved infrastructure.</li><li>Test access controls and workflow approvals before production use.</li><li>Retain configuration digests and audit evidence under customer policy.</li></ul>
          <div className="flex flex-wrap gap-4 pt-3 text-sm font-semibold"><Link href="/products/papyrus" className="text-[#254eab] underline underline-offset-4">Papyrus product →</Link><Link href="/support" className="text-[#254eab] underline underline-offset-4">Support →</Link></div>
        </Section>
      </article>
      <aside className="hidden xl:block"><div className="sticky top-28 border-l border-[#e4e9f0] pl-5"><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#8b97aa]">On this page</p><nav className="mt-4 flex flex-col gap-3 text-[12px] text-[#718095]">{sections.map(([id,label])=><a key={id} href={`#${id}`} className="hover:text-[#e85927]">{label}</a>)}</nav></div></aside>
    </div>
  </main>
}
