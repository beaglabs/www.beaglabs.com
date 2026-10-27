// Papyrus capabilities and controls overview: a short, illustrated companion to the evidence pack, in the brief style.
//
//   node scripts/compliance/capabilities.mjs        (after build.mjs; reads the pack's source/ and index.json)
//
// Writes public/compliance/papyrus/papyrus-capabilities.pdf. Screenshots live in scripts/compliance/capabilities/.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const pack = join(here, '..', '..', 'public', 'compliance', 'papyrus')
const manifest = JSON.parse(readFileSync(join(pack, 'index.json'), 'utf8'))
const controls = JSON.parse(readFileSync(join(pack, 'source', 'controls.json'), 'utf8'))
const aiRmf = JSON.parse(readFileSync(join(pack, 'source', 'ai-rmf.json'), 'utf8'))
const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const day = new Date().toISOString().slice(0, 10)
const counts = manifest.controlsReview.counts

/** A screenshot with its caption, framed like the brief's cards. */
const shot = (file, caption, size = '') => `<figure class="shot ${size}"><img src="capabilities/${file}.jpg" alt=""><figcaption>${caption}</figcaption></figure>`
/** A titled list of what a capability does, each point naming the control it answers. */
const points = (items) => `<ul class="points">${items.map(([text, refs]) => `<li><span>${text}</span>${refs ? `<em>${refs}</em>` : ''}</li>`).join('')}</ul>`
const section = (number, kicker, title, body) => `<section class="page"><p class="kicker"><b>${String(number).padStart(2, '0')}</b> ${kicker}</p><h1>${title}</h1>${body}</section>`

/** A complete papyrus.yaml for a disconnected, SECRET deployment; validated against the schema when this page was written. */
const EXAMPLE_YAML = `version: 1

server:
  mode: persistent
  profile: disconnected   # only listed hosts
  publicOrigin: https://papyrus.enclave.mil
  organizationName: Example Command
  tls:
    cert: /etc/papyrus/tls/cert.pem
    key: /etc/papyrus/tls/key.pem

identity:
  oidc:
    issuer: https://login.enclave.mil/realms/papyrus
    clientId: papyrus
    clientSecret: { file: /run/secrets/oidc-secret }
  owners: [isso@enclave.mil]   # first System Owners
  groupRoles:
    papyrus-admins: [Papyrus.System.Owner]
    papyrus-auditors: [Papyrus.Audit.View]
    papyrus-users: [Papyrus.Agents.Execute]

security:
  notice: dow             # DoD notice and consent
  classification: secret  # banner on every screen
  sessions:
    idleMinutes: 15
    maxHours: 12
    concurrent: 3

audit:
  otlp:
    endpoint: https://siem.enclave.mil:4318/v1/logs
    ca: /etc/papyrus/siem-ca.pem
    clientCert: /etc/papyrus/siem-client.pem
    clientKey: /etc/papyrus/siem-client.key

egress:
  allowedHosts:
    - login.enclave.mil
    - llm.enclave.mil
    - git.enclave.mil
    - siem.enclave.mil

models:
  default: enclave
  gateways:
    - id: enclave
      baseUrl: https://llm.enclave.mil/v1
      model: llama-3.3-70b-instruct
      apiKey: { file: /run/secrets/llm-key }

repositories:
  tokens:
    git.enclave.mil: { file: /run/secrets/git-token }

license:
  file: /etc/papyrus/license.json`
/** Comments in grey and keys in bold, so the example reads at a glance. */
const highlight = (text) => escape(text).split('\n').map(line => line.replace(/(#.*)$/, '<i>$1</i>').replace(/^(\s*-?\s*)([\w.-]+):/, '$1<b>$2</b>:')).join('\n')

/** One line per 800-53 family: what Papyrus brings to it, written for a reader who has not seen the product. */
const FAMILY_SUMMARY = {
  'Access Control': 'Roles from the identity provider and papyrus.yaml; server-side sessions with a 15-minute idle limit, 12-hour cap and 3 per person; the DoD notice before sign-in; a system-high classification banner; an egress allow-list for everything agents reach.',
  'Audit and Accountability': 'One append-only audit trail of sign-ins, sign-outs, refusals and acceptances, with client address and request IDs; exported to the organization\'s SIEM over OTLP; reviewed and exported on the Audit page.',
  'Configuration Management': 'papyrus.yaml validated at startup and recorded at every start; one signed, STIG-scanned image; governed changes need a second person; least functionality by design.',
  'Contingency Planning': 'The deploying organization backs up the data directory and its keys; Papyrus documents which files belong together.',
  'Identification and Authentication': 'OpenID Connect or Entra sign-in with PKCE; multi-factor and smart cards enforced by the identity provider; no local passwords; API keys hashed, scoped and expiring.',
  'Incident Response': 'Owned by the deploying organization; Papyrus supplies the audit trail, traces and agent evidence as inputs.',
  'Risk Assessment': 'DISA STIG scan of every image in CI and Trivy scans of each released platform in this pack.',
  'System and Services Acquisition': 'Papyrus calls no Beag Labs service; licenses verify locally; security tests run in the repository.',
  'System and Communications Protection': 'FIPS 140-3 cryptography enforced at startup; TLS; kernel-sandboxed agent code with no network; encrypted credentials; secure deletion in databases.',
  'System and Information Integrity': 'Signed, digest-pinned updates; input validation at every route; monitoring through traces and the audit trail.',
  'Supply Chain Risk Management': 'Signed images with SLSA build provenance and SBOMs for every platform.',
}
const families = [...new Set(controls.controls.map(control => control.family))]
const familyRows = families.map(family => {
  const items = controls.controls.filter(control => control.family === family)
  const tag = (status) => items.filter(control => control.status === status).map(control => control.id.toUpperCase())
  return `<tr><td><b>${escape(family)}</b></td><td>${escape(FAMILY_SUMMARY[family] ?? '')}</td><td class="ids">${[['implemented', tag('implemented')], ['partial', tag('partial')], ['customer', tag('customer')]].filter(([, ids]) => ids.length).map(([status, ids]) => `<span class="pill ${status}">${status}</span> ${ids.join(', ')}`).join('<br>')}</td></tr>`
}).join('')

const fnRows = ['Govern', 'Map', 'Measure', 'Manage'].map(fn => {
  const items = aiRmf.subcategories.filter(item => item.function === fn)
  return `<tr><td><b>${fn}</b></td><td>${items.map(item => `<b>${escape(item.id)}</b> ${escape(item.title)}${item.status === 'supported' ? '' : ` <span class="pill ${item.status === 'partial' ? 'partial' : 'customer'}">${item.status}</span>`}`).join('<br>')}</td></tr>`
}).join('')

const gaps = [
  ...controls.programGaps.filter(gap => gap.risk === 'high').map(gap => gap.title),
  ...controls.controls.filter(control => control.gap && control.gap.risk === 'high').map(control => `${control.id.toUpperCase()}: ${control.gap.description}`),
]

const body = `
<section class="cover">
  <header class="top"><div class="brand"><span class="mark">B_</span><span class="brand-name">BEAG LABS</span></div>
    <div class="crumbs"><span>Papyrus</span><span class="slash">/</span><span>Capabilities and controls</span><span class="slash">/</span><span>${day}</span></div></header>
  <div class="main">
    <div class="hero">
      <div class="hero-text">
        <span class="chip">Capabilities overview</span>
        <h1>Governed agents <span class="o">inside your boundary</span></h1>
        <p class="lead">Papyrus runs named, signed AI agents in your own environment, including disconnected and classified enclaves. People stay accountable for what each agent may do, every security event is recorded, and nothing leaves the boundary unless you allow it.</p>
      </div>
      <div class="art"><img src="capabilities/mark.jpg" alt=""></div>
    </div>
    <dl class="facts">
      <div><dt>800-53 controls mapped</dt><dd>${controls.controls.length} (${counts.implemented} implemented, ${counts.partial} partial, ${counts.customer} customer owned)</dd></div>
      <div><dt>NIST AI RMF</dt><dd>${aiRmf.subcategories.length} subcategories mapped, plus the Generative AI Profile</dd></div>
      <div><dt>Cryptography</dt><dd>FIPS 140-3 (OpenSSL provider, CMVP #5438), enforced at startup</dd></div>
      <div><dt>Release reviewed</dt><dd>${escape(manifest.release.version)}${manifest.controlsReview.localChanges ? ', with changes since' : ''}</dd></div>
    </dl>
    <div class="award"><img src="capabilities/tradewinds.png" alt="Awardable: Tradewinds Solutions Marketplace, Chief Digital and Artificial Intelligence Office"><p><b>Awardable on Tradewinds</b>Papyrus is listed on the Chief Digital and Artificial Intelligence Office's Tradewinds Solutions Marketplace, so DoD buyers can procure it directly.</p></div>
    <p class="note">Prepared by Beag Labs from the Papyrus source. Screenshots are from a test deployment marked SECRET to show the classification banner; they contain no classified information. This overview accompanies the Papyrus evidence pack and is not a certification, an authorization or a third-party assessment.</p>
  </div>
</section>

${section(1, 'At a glance', 'What Papyrus <span class="o">is</span>', `
<p class="intro">Papyrus is an agent runtime an organization deploys itself: one hardened container image or an Azure VM appliance, configured by a reviewable <code>papyrus.yaml</code>. Agents work over the organization's documents and connected systems through tools it approves, and people sign, approve and audit what they do.</p>
<div class="cards">
  <div class="card"><b>Your environment</b><p>Runs in your network, including disconnected enclaves. Calls no Beag Labs service; licenses verify locally.</p></div>
  <div class="card"><b>Your identity provider</b><p>Sign-in through your OpenID Connect provider or Entra ID. Multi-factor and smart cards stay under your policy.</p></div>
  <div class="card"><b>Your models</b><p>Only the model gateways you list. Government and disconnected profiles never fall back to a commercial endpoint.</p></div>
  <div class="card"><b>Your evidence</b><p>Append-only audit trail, exported to your SIEM over OTLP. Signed agent revisions and run records.</p></div>
</div>
<h2>Deployment posture</h2>
${points([
  ['Amazon Linux 2023 image with OpenSSL\'s certified FIPS 140-3 provider forced on; Papyrus refuses to start outside FIPS mode.', 'SC-13'],
  ['Scanned against the DISA STIG profile for Amazon Linux 2023 in CI; signed with build provenance and SBOMs.', 'CM-2, RA-5, SR-4'],
  ['Configuration in <code>papyrus.yaml</code>: validated at startup, secrets only by reference, recorded with its digest at every start.', 'CM-6'],
  ['No first-run setup page. Identity, owners, license, notice and classification all come from the file.', 'AC-2, CM-6'],
  ['Three profiles set network posture: commercial, government and disconnected.', 'AC-4, SC-7'],
])}`)}

${section(2, 'Configuration as code', 'One file <span class="o">you can review</span>', `
<div class="config">
  <div>
    <p class="intro">Everything a deployment needs is in <code>papyrus.yaml</code>: identity, owners, notice, classification, sessions, models, audit export, network allow-list and license. There is no setup page and no settings screen that can drift from it.</p>
    ${points([
      ['Found at <code>PAPYRUS_CONFIG_FILE</code>, else <code>/etc/papyrus/papyrus.yaml</code>. Environment variables override the file; defaults fill the rest.', 'CM-6'],
      ['Secrets never appear in the file, only references: <code>{ file: … }</code> or <code>{ env: … }</code>, so it can be committed and attached to an evidence package.', 'IA-5'],
      ['Checked against its schema at startup. An unknown key, a wrong value or an unreadable secret stops startup with every problem listed.', 'CM-6'],
      ['<code>--check-config</code> prints the effective settings, secrets hidden, and where each came from, then exits.', 'CM-2'],
      ['Each start records the file, its digest and every effective setting, and flags a change since the last start.', 'CM-3, AU-2'],
    ])}
  </div>
  <pre class="yaml"><span class="file">papyrus.yaml</span>${highlight(EXAMPLE_YAML)}</pre>
</div>
<p class="footnote">A disconnected deployment marked SECRET: OIDC sign-in, the DoD notice, an enclave model gateway, audit to the SIEM over mutual TLS, and only listed hosts reachable. The JSON Schema for every key is published with Papyrus as <code>papyrus.config.schema.json</code>.</p>`)}

${section(3, 'Agent Roster', 'Named agents, <span class="o">not chatbots</span>', `
${shot('roster', 'The roster. Each card is a named agent with its state and revision; a draft becomes usable only when it is signed and activated. With <b>Require agent sign-off</b> on, a second person must approve every revision.')}
${points([
  ['Every agent is a versioned configuration: instructions, model, limits and channels.', 'AI RMF GOVERN 1.6'],
  ['Only an active, signed revision runs. Agents can be paused, archived (deactivated, history kept) or superseded.', 'AI RMF GOVERN 1.7, MANAGE 2.4'],
  ['Each agent runs within signed limits: steps, tool calls, time, compute, storage and runs.', 'AI RMF MANAGE 2.2'],
])}`)}

${section(4, 'Signed revisions', 'Every change <span class="o">is signed</span>', `
${shot('agent', 'An agent\'s detail. The creator\'s signature uses a one-time key certified by the deployment after a fresh sign-in, and verifies against this exact configuration, its tools and model, and the current policy.')}
${points([
  ['Creator and independent approver are recorded by identity on every revision; one person cannot approve their own.', 'AC-5, AI RMF GOVERN 1.4'],
  ['Signatures are Sigstore bundles verifiable outside Papyrus against the deployment\'s trust root.', 'AI RMF MEASURE 2.8'],
])}`)}

${section(5, 'Independent authorization', 'Two-person <span class="o">review</span>', `
${shot('requests', 'Requests. Reviewers see each revision\'s configuration against the previous one, verify both signatures, and approve or reject the exact revision.', 'half')}
${shot('scope', 'The approved scope a signature covers: model, execution limits, channel ceiling, tools, knowledge and skills.', 'half')}`)}

${section(6, 'Sessions', 'People stay <span class="o">in control</span>', `
${shot('session', 'An agent session in a deployment marked SECRET. The header shows the agent, its signed revision and its model; the banner carries the system-high classification on every screen.')}
${points([
  ['Consequential actions are proposed by the agent and approved by a person holding Action.Approve; workflow approval gates wait for the named person or group.', 'AC-5, AI RMF GOVERN 3.2'],
  ['Agents ask questions and wait, and notify people through the Inbox when work finishes.', 'AI RMF MAP 3.5'],
  ['Agent code runs in a kernel sandbox (Landlock and seccomp) with no network; credentials never reach the model.', 'SC-39, AC-4'],
  ['Every action is attributed to the person the agent ran for.', 'AU-3, AI RMF MEASURE 2.8'],
])}`)}

${section(7, 'Library', 'Documents stay <span class="o">put</span>', `
${shot('library', 'The Library browses the durable files agents create or are given. Files remain in the deployment\'s own store; this page is a browser, not a second copy.')}
${points([
  ['Agents cite Library passages with source path, page and SHA-256.', 'AI RMF 600-1 confabulation'],
  ['Repositories and packages are downloaded by the server, never the sandbox, through the egress allow-list; nothing in them runs.', 'AC-4, SC-7'],
  ['Databases overwrite deleted content (secure_delete); credentials are encrypted with AES-256-GCM.', 'SC-4, SC-28'],
])}`)}

${section(8, 'Audit', 'Who did what, <span class="o">from where</span>', `
${shot('audit', 'The Audit page for System Owners and Audit Viewers: export health, search and filters, each record in full, and CSV or JSONL export.')}
${points([
  ['Sign-ins (and failures), sign-outs, idle session ends, notice acknowledgements, Terms acceptance and every refused request.', 'AU-2, AC-7'],
  ['Each record: time, action, outcome, actor and on-behalf-of, target, client address, user agent, request and session IDs.', 'AU-3'],
  ['Append-only in the database, and delivered to your OpenTelemetry collector over OTLP (TLS or mutual TLS), resuming after outages.', 'AU-6, AU-9'],
])}`)}

${section(9, 'Identity and access', 'Sign-in <span class="o">your way</span>', points([
  ['OpenID Connect (Okta, Keycloak, Ping and others) or Microsoft Entra ID, with PKCE, single-use state and nonce.', 'IA-2'],
  ['The standard DoD notice and consent banner, or your own text, before sign-in; each acknowledgement audited.', 'AC-8'],
  ['Server-side sessions: 15 minutes idle, 12 hours maximum, sign-out revokes, at most 3 per person; all configurable.', 'AC-10, AC-11, AC-12'],
  ['Roles from identity-provider groups; first System Owners named in papyrus.yaml; SCIM 2.0 deprovisioning takes effect on the next request.', 'AC-2'],
  ['A System Owner accepts the Terms of Service and Privacy Policy in the app before anyone can use it.', 'AC-3'],
  ['API keys for automation start only the workflows they name, are stored as keyed hashes and expire.', 'IA-5'],
]) + `<h2>Network boundary</h2>` + points([
  ['<code>egress.allowedHosts</code> is the only way out for workflow HTTP steps, link previews, MCP servers and repository imports; on the disconnected profile nothing is reached until listed.', 'AC-4, SC-7'],
  ['No telemetry to Beag Labs. Error reporting is off unless you set your own Sentry address.', 'SA-9'],
]))}

${section(10, 'NIST SP 800-53 Rev. 5', 'Control <span class="o">families</span>', `
<p class="intro">${controls.controls.length} controls are mapped with source evidence in <code>papyrus-security-controls.pdf</code> and <code>papyrus-controls-matrix.xlsx</code>, and in OSCAL form. Responsibility is shared: Papyrus enforces what it can in code, and the deploying organization owns the rest.</p>
<table class="families"><thead><tr><th style="width:20%">Family</th><th>What Papyrus provides</th><th style="width:24%">Controls</th></tr></thead><tbody>${familyRows}</tbody></table>`)}

${section(11, 'NIST AI RMF 1.0', 'AI risk <span class="o">management</span>', `
<p class="intro">${escape(aiRmf.scope)}</p>
<table class="families"><thead><tr><th style="width:14%">Function</th><th>Subcategories Papyrus supports</th></tr></thead><tbody>${fnRows}</tbody></table>
<h2>Generative AI Profile</h2>
<table class="families"><thead><tr><th style="width:30%">Risk</th><th>How Papyrus addresses it</th></tr></thead><tbody>${aiRmf.generativeAi.map(item => `<tr><td><b>${escape(item.risk)}</b></td><td>${escape(item.response)}</td></tr>`).join('')}</tbody></table>`)}

${section(12, 'Plain dealing', 'What is <span class="o">still open</span>', `
<p class="intro">Every partial control has an entry in the known gaps plan and POA&amp;M in the evidence pack. The highest-risk items:</p>
<ul class="gaps">${gaps.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
<h2>In the evidence pack</h2>
<table class="families"><tbody>
<tr><td><b>Security controls</b></td><td><code>papyrus-security-controls.pdf</code>, <code>papyrus-controls-matrix.xlsx</code>, <code>oscal/papyrus-component-definition.json</code></td></tr>
<tr><td><b>AI RMF</b></td><td><code>papyrus-ai-rmf.pdf</code>, <code>papyrus-ai-rmf.xlsx</code></td></tr>
<tr><td><b>Known gaps</b></td><td><code>papyrus-known-gaps.pdf</code>, <code>papyrus-poam.xlsx</code>, <code>oscal/papyrus-poam.json</code></td></tr>
<tr><td><b>Architecture and deployment</b></td><td><code>papyrus-architecture.pdf</code>, <code>papyrus-deployment-requirements.pdf</code></td></tr>
<tr><td><b>Supply chain</b></td><td><code>papyrus-supply-chain-evidence.pdf</code>, SBOMs, signature and provenance verification, vulnerability scans</td></tr>
</tbody></table>
<p class="contact">Questions: <b>legal@beaglabs.com</b> · Beag Labs, Inc., 102 O Street, Lenoir City, TN 37771</p>`)}
`

const css = `
.hero { display: grid; grid-template-columns: 1.25fr 1fr; gap: 26px; align-items: center; }
.hero .cover-h1, .cover .hero h1 { font-size: 52px; }
.hero .lead { font-size: 13px; }
.art { aspect-ratio: 1; height: auto; margin-right: 9px; border: 3px solid var(--ink); box-shadow: 9px 9px 0 var(--ink); overflow: hidden; }
.art { background: #fe5a17; }
.art img { width: 100%; height: 100%; object-fit: cover; display: block; }
.award { display: flex; align-items: center; gap: 18px; margin: 26px 6px 0 0; padding: 12px 16px; border: 3px solid var(--ink); box-shadow: 6px 6px 0 var(--orange); }
.award img { width: 92px; height: 92px; flex: none; }
.award p { font-size: 10.5px; line-height: 1.5; }
.award b { display: block; font-family: 'Roboto Condensed'; font-weight: 900; text-transform: uppercase; font-size: 18px; letter-spacing: -.005em; }
.page { break-before: page; }
.page:first-of-type { break-before: auto; }
.kicker { font-family: 'JetBrains Mono'; font-size: 8.5px; letter-spacing: .18em; text-transform: uppercase; color: var(--orange-deep); margin-bottom: 6px; }
.kicker b { background: var(--ink); color: #fff; padding: 1px 5px; margin-right: 6px; }
.doc .page h1 { font-size: 34px; margin-bottom: 14px; }
.doc .page h1 .o { color: var(--orange); }
.intro { font-size: 11.5px; line-height: 1.55; margin-bottom: 14px !important; }
.shot { margin: 0 6px 16px 0; border: 3px solid var(--ink); box-shadow: 7px 7px 0 var(--orange); background: #fff; break-inside: avoid; }
.shot img { display: block; width: 100%; height: auto; border-bottom: 3px solid var(--ink); }
.shot.half img { height: 330px; object-fit: cover; object-position: 50% 0; }
.shot figcaption { padding: 8px 12px; font-size: 9.6px; line-height: 1.5; background: var(--tint); }
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 4px 6px 18px 0; }
.card { border: 2px solid var(--ink); box-shadow: 4px 4px 0 var(--ink); padding: 11px 13px; break-inside: avoid; }
.card b { font-family: 'Roboto Condensed'; font-weight: 900; text-transform: uppercase; font-size: 15px; }
.card p { margin: 4px 0 0 !important; font-size: 9.8px; }
.points { list-style: none; margin: 0 0 10px !important; padding: 0; }
.points li { display: flex; justify-content: space-between; gap: 14px; padding: 7px 0; border-top: 1.5px solid #d9d4cc; font-size: 10.2px; margin: 0 !important; break-inside: avoid; }
.points li em { flex: none; font-style: normal; font-family: 'JetBrains Mono'; font-size: 7.4px; letter-spacing: .08em; color: var(--orange-deep); text-transform: uppercase; max-width: 34%; text-align: right; }
.families td { font-size: 8.8px; }
.config { display: grid; grid-template-columns: 1fr 1.05fr; gap: 18px; align-items: start; }
.config .points li { flex-direction: column; gap: 3px; }
.config .points li em { max-width: none; text-align: left; }
.yaml { margin: 0 6px 0 0 !important; font-size: 7.6px !important; white-space: pre !important; line-height: 1.5; background: #111 !important; color: #f4f2ef; border: 3px solid var(--ink) !important; box-shadow: 6px 6px 0 var(--orange); padding: 10px 12px !important; }
.yaml b { color: #ffb894; font-weight: 700; }
.yaml i { color: #8f8a83; font-style: normal; }
.yaml .file { display: block; margin: -2px 0 8px; padding-bottom: 6px; border-bottom: 1px solid #444; color: var(--orange); letter-spacing: .14em; text-transform: uppercase; font-size: 7px; }
.footnote { font-size: 9px; color: var(--muted); margin-top: 12px !important; }
.families td.ids { font-family: 'JetBrains Mono'; font-size: 7.4px; line-height: 1.8; }
.gaps { margin: 0 0 14px 16px !important; }
.gaps li { margin: 5px 0 !important; font-size: 9.8px; }
.contact { margin-top: 18px !important; font-size: 10px; border-top: 3px solid var(--ink); padding-top: 10px; }
`

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Papyrus capabilities and controls</title><link rel="stylesheet" href="evidence.css">
<style>@page { @top-left { content: 'BEAG LABS  /  PAPYRUS CAPABILITIES AND CONTROLS' } }${css}</style></head>
<body>${body.replace(/<section class="page">/g, '<section class="page doc">')}</body></html>`
const source = join(here, 'papyrus-capabilities.html')
writeFileSync(source, html)

const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {})
const tab = await browser.newPage()
await tab.goto(`file://${source}`, { waitUntil: 'networkidle' })
await tab.pdf({ path: join(pack, 'papyrus-capabilities.pdf'), printBackground: true, preferCSSPageSize: true, tagged: true, outline: true })
if (process.argv.includes('--png')) {
  await tab.setViewportSize({ width: 816, height: 1056 })
  await tab.screenshot({ path: join(here, 'out', 'papyrus-capabilities.png'), fullPage: true })
}
await browser.close()
console.log('Wrote papyrus-capabilities.pdf')
