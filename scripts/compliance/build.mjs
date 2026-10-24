// Render the Papyrus evidence pack PDFs in the solution-brief style, then write the pack README and SHA256SUMS.
// The pack itself (SBOMs, scans, OSCAL, spreadsheets, sources) comes from the Papyrus repo:
//
//   node ../papyrus/scripts/compliance/pack.mjs --revision <sha>
//   node scripts/compliance/build.mjs            # add --png for page previews in scripts/compliance/out
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const pack = join(root, 'public', 'compliance', 'papyrus')
const reviewDir = join(here, 'out')
const manifest = JSON.parse(readFileSync(join(pack, 'index.json'), 'utf8'))
const controls = JSON.parse(readFileSync(join(pack, 'source', 'controls.json'), 'utf8'))
const escape = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const short = (digest) => digest.replace('sha256:', '').slice(0, 12)
const day = manifest.release.date.slice(0, 10)

// The homepage hero's field, seeded so every build draws the same dots.
const DOT_COLORS = ['#ff5f1f', '#ff8a5c', '#ffb894', '#ffffff', '#ffc9b0']
function dots(width, height, seed, spacing = 15, radius = 6.4) {
  let s = seed, circles = ''
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
  for (let y = spacing / 2; y < height; y += spacing) for (let x = spacing / 2; x < width; x += spacing)
    circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${DOT_COLORS[Math.floor(rand() * DOT_COLORS.length)]}"/>`
  return `<svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000"/>${circles}</svg>`
}

const NOTE = 'Prepared by Beag Labs from the Papyrus source and its published release image. Describes the software and the responsibilities it leaves to a deploying organization. It is not a certification, an authorization or a third-party assessment.'
const cover = ({ name, title, lead, seed }) => `
<section class="cover">
  <header class="top"><div class="brand"><span class="mark">B_</span><span class="brand-name">BEAG LABS</span></div>
    <div class="crumbs"><span>Papyrus evidence pack</span><span class="slash">/</span><span>${escape(name)}</span><span class="slash">/</span><span>${day}</span></div></header>
  <div class="main">
    <span class="chip">Papyrus evidence pack</span>
    <h1>${title}</h1>
    <p class="lead">${lead}</p>
    <div class="banner">${dots(736, 210, seed)}</div>
    <dl class="facts">
      <div><dt>Release</dt><dd>${escape(manifest.release.version)}</dd></div>
      <div><dt>Built</dt><dd>${escape(manifest.release.date)}</dd></div>
      <div><dt>Image</dt><dd>${escape(manifest.image.repository)}</dd></div>
      <div><dt>Index digest</dt><dd>${escape(manifest.image.digest)}</dd></div>
    </dl>
    <p class="note">${NOTE}</p>
  </div>
  <footer class="foot"><span>Beag Labs, Inc. · beaglabs.com</span><span>beaglabs.com/compliance/papyrus</span></footer>
</section>`

// Mermaid starts on load unless told otherwise, which would draw with its default theme before ours applies.
const MERMAID = { startOnLoad: false, theme: 'base', securityLevel: 'strict', fontFamily: 'Work Sans', flowchart: { nodeSpacing: 34, rankSpacing: 46, padding: 10 }, themeVariables: { primaryColor: '#fff1e9', primaryBorderColor: '#111111', primaryTextColor: '#111111', lineColor: '#111111', secondaryColor: '#f4f2ef', tertiaryColor: '#ffffff', clusterBkg: '#faf8f5', clusterBorder: '#111111', fontSize: '15px', actorBkg: '#fff1e9', actorBorder: '#111111', noteBkgColor: '#fff1e9', noteBorderColor: '#c2410c' } }
const html = (doc, body) => `<!doctype html><html><head><meta charset="utf-8"><title>${escape(doc.name)} · Papyrus</title><link rel="stylesheet" href="evidence.css">
<style>@page { @top-right { content: '${doc.name.toUpperCase()}'; } }</style>
<script src="../../node_modules/mermaid/dist/mermaid.min.js"></script><script>mermaid.initialize(${JSON.stringify(MERMAID)})</script></head>
<body>${cover(doc)}<main class="doc">${body}</main></body></html>`

/** Markdown sources: drop the top heading (the cover carries it) and turn mermaid fences into diagrams. */
function markdown(file) {
  const text = readFileSync(join(pack, 'source', file), 'utf8').replace(/^# .*\n+/, '')
  const renderer = new marked.Renderer()
  const code = renderer.code.bind(renderer)
  renderer.code = (token) => token.lang === 'mermaid' ? `<div class="diagram"><pre class="mermaid">${escape(token.text)}</pre></div>` : code(token)
  return marked.parse(text, { gfm: true, renderer })
}

const pill = (value) => `<span class="pill ${escape(value)}">${escape(value)}</span>`
const paths = (items) => items.map(item => `<code>${escape(item.path)}</code>`).join(', ')
const counts = manifest.controlsReview.counts
const stats = (items) => `<div class="grid">${items.map(([value, label]) => `<div class="stat"><b>${value}</b><span>${label}</span></div>`).join('')}</div>`
const reviewed = `Controls were reviewed against Papyrus source revision <code>${manifest.controlsReview.sourceRevision.slice(0, 12)}</code>${manifest.controlsReview.localChanges ? ' including changes not yet released' : ''}. The release image was built from <code>${manifest.release.revision.slice(0, 12)}</code>.`

function controlsBody() {
  const families = [...new Set(controls.controls.map(control => control.family))]
  return `<h1>Security controls matrix</h1>
  <p>How Papyrus contributes to ${escape(controls.catalog)} controls when a customer deploys it, and what remains with the deploying organization. ${reviewed}</p>
  ${stats([[counts.implemented, 'Implemented'], [counts.partial, 'Partial'], [counts.planned, 'Planned'], [counts.customer, 'Customer owned']])}
  <div class="callout"><b>Reading this matrix.</b> <i>Implemented</i> means Papyrus code enforces the behavior described; <i>partial</i> and <i>planned</i> items have an open entry in the known gaps plan. <i>Responsibility</i> shows whether Papyrus (provider), the deploying organization (customer) or both (shared) carry the control. The machine-readable form is <code>oscal/papyrus-component-definition.json</code>; source evidence paths for every row are in <code>papyrus-controls-matrix.xlsx</code>.</div>
  ${families.map(family => `<h2>${escape(family)}</h2>
  <table><thead><tr><th style="width:9%">Control</th><th style="width:11%">Status</th><th style="width:47%">Papyrus implementation</th><th>Deploying organization</th></tr></thead><tbody>
  ${controls.controls.filter(control => control.family === family).map(control => `<tr><td><b>${control.id.toUpperCase()}</b><br>${escape(control.title)}</td><td>${pill(control.status)}<br><span class="evidence">${escape(control.responsibility)}</span></td>
    <td>${escape(control.statement)}${control.evidence.length ? `<div class="evidence">Evidence: ${paths(control.evidence)}</div>` : ''}${control.verification.length ? `<div class="evidence">Tests: ${paths(control.verification)}</div>` : ''}</td><td>${escape(control.customer)}</td></tr>`).join('')}
  </tbody></table>`).join('')}`
}

function gapsBody() {
  const gaps = [
    ...controls.controls.filter(control => control.gap).map(control => ({ controls: control.id.toUpperCase(), title: `${control.id.toUpperCase()} ${control.title}`, ...control.gap })),
    ...controls.programGaps.map(gap => ({ ...gap, controls: (gap.controls ?? []).map(id => id.toUpperCase()).join(', ') || 'Program' })),
  ]
  const byRisk = (risk) => gaps.filter(gap => gap.risk === risk).length
  return `<h1>Known gaps and remediation plan</h1>
  <p>Open items for the Papyrus software, including controls that are partly implemented or not yet verified, testing still to be done, and dependencies on an authorized hosting environment. ${reviewed}</p>
  ${stats([[gaps.length, 'Open items'], [byRisk('high'), 'High'], [byRisk('moderate'), 'Moderate'], [byRisk('low'), 'Low']])}
  <div class="callout">The same items are in <code>oscal/papyrus-poam.json</code> (OSCAL POA&amp;M) and <code>papyrus-poam.xlsx</code>, whose columns follow FedRAMP POA&amp;M template headings so they can be merged into a deploying organization's own plan.</div>
  <table><thead><tr><th style="width:8%">ID</th><th style="width:22%">Item</th><th style="width:33%">Gap</th><th style="width:27%">Remediation</th><th>Milestone</th></tr></thead><tbody>
  ${gaps.map((gap, index) => `<tr><td><b>PAP-${String(index + 1).padStart(3, '0')}</b><br>${pill(gap.risk)}</td><td><b>${escape(gap.title)}</b><div class="evidence">${escape(gap.controls)}</div></td><td>${escape(gap.description)}</td><td>${escape(gap.remediation)}</td><td>${escape(gap.milestone)}</td></tr>`).join('')}
  </tbody></table>`
}

function supplyChainBody() {
  const { image, signature, provenance, tools, verify } = manifest
  const severities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']
  const files = listFiles(pack).filter(path => /\/(sbom|supply-chain)\//.test(path)).map(path => [relative(pack, path), sha256(path)])
  return `<h1>Container supply-chain evidence</h1>
  <p>Evidence for the published Papyrus image <code>${escape(image.repository)}@${escape(image.digest)}</code>, built from revision <code>${escape(manifest.release.revision)}</code> on ${escape(manifest.release.date)}. Every item below was produced or checked by tools against that digest; the commands to repeat each check are at the end.</p>
  <h2>Image</h2>
  <table><thead><tr><th>Platform</th><th>Manifest digest</th><th>Created</th><th>User</th><th>Layers</th><th>SBOM components</th></tr></thead><tbody>
  ${image.platforms.map(platform => `<tr><td><b>${escape(platform.platform)}</b></td><td><code>${escape(platform.digest)}</code></td><td>${escape(platform.created)}</td><td>${escape(platform.user || 'root')}</td><td>${platform.layers}</td><td>${platform.components}</td></tr>`).join('')}
  </tbody></table>
  <h2>Signature</h2>
  <p>The multi-arch index is signed keylessly with Sigstore cosign by GitHub Actions and recorded in the ${escape(signature.transparencyLog)} transparency log. Verification ${signature.verified ? 'passed' : 'failed'} for workflow identity <code>${escape(signature.identity)}</code> from issuer <code>${escape(signature.issuer)}</code>, at workflow revision <code>${escape(signature.workflowSha)}</code> on <code>${escape(signature.ref)}</code>.</p>
  <h2>Build provenance</h2>
  <p>A <code>${escape(provenance.predicateType)}</code> attestation for the index digest was ${provenance.verified ? 'verified' : 'not verified'}: signed by <code>${escape(provenance.signer)}</code> on a ${escape(provenance.runner)} runner from source <code>${escape(provenance.sourceSha)}</code>. The source repository is private, so the attestation is signed through ${escape(provenance.trustRoot)}; the Sigstore bundle is published in this pack so it can be verified without repository access.</p>
  <h2>Vulnerability scan</h2>
  <p>Scanned with Trivy ${escape(tools.trivy.version)}${tools.trivy.vulnerabilityDb ? ` using the vulnerability database updated ${escape(tools.trivy.vulnerabilityDb.UpdatedAt)}` : ''}. Counts are findings, with the number that have a fixed version available in brackets. A scan is a point-in-time result; rescan the digest for current findings.</p>
  <table><thead><tr><th>Platform</th>${severities.map(severity => `<th>${severity}</th>`).join('')}</tr></thead><tbody>
  ${image.platforms.map(platform => `<tr><td><b>${escape(platform.platform)}</b></td>${severities.map(severity => `<td>${platform.vulnerabilities.counts[severity] ?? 0} (${platform.vulnerabilities.fixable[severity] ?? 0})</td>`).join('')}</tr>`).join('')}
  </tbody></table>
  <h2>Software bill of materials</h2>
  <p>Each platform has a CycloneDX and an SPDX SBOM generated from the image itself, so they include operating system packages and every transitive Node.js and Python dependency in the shipped filesystem. Timestamps and serial numbers are pinned to the image so repeated runs produce identical documents.</p>
  <h2>How to verify</h2>
  <h3>Signature (cosign 2.4+)</h3><pre><code>${escape(verify.signature)}</code></pre>
  <h3>Provenance (GitHub CLI 2.60+, run from this pack's folder)</h3><pre><code>${escape(verify.provenance)}</code></pre>
  <h3>SBOM and scan (Trivy)</h3><pre><code>${escape(verify.sbom)}</code></pre>
  <h2>Files</h2>
  <table><thead><tr><th>File</th><th>SHA-256</th></tr></thead><tbody>${files.map(([path, digest]) => `<tr><td><code>${escape(path)}</code></td><td><code>${digest}</code></td></tr>`).join('')}</tbody></table>`
}

const DOCS = [
  { file: 'papyrus-architecture', name: 'Architecture', title: 'Papyrus <span class="o">architecture</span>', lead: 'System boundaries, runtime components, model gateways, integrations, data flows and deployment topology.', seed: 11, body: () => `<h1>Architecture</h1>${markdown('architecture.md')}` },
  { file: 'papyrus-deployment-requirements', name: 'Deployment requirements', title: 'Deployment <span class="o">requirements</span>', lead: 'Compute, storage, networking, runtime dependencies, offline constraints and external services.', seed: 23, body: () => `<h1>Deployment requirements</h1>${markdown('deployment-requirements.md')}` },
  { file: 'papyrus-security-controls', name: 'Security controls', title: 'Security <span class="o">controls</span> matrix', lead: 'Authentication, RBAC, encryption, isolation, auditing, secrets handling and known gaps, mapped to NIST SP 800-53 Rev. 5.', seed: 37, body: controlsBody },
  { file: 'papyrus-supply-chain-evidence', name: 'Supply chain', title: 'Supply-chain <span class="o">evidence</span>', lead: 'Image digests, signatures, build provenance, SBOMs and vulnerability scans for this release.', seed: 41, body: supplyChainBody },
  { file: 'papyrus-known-gaps', name: 'Known gaps', title: 'Known gaps <span class="o">and plan</span>', lead: 'Controls awaiting verification, incomplete testing and dependencies on an authorized hosting environment.', seed: 53, body: gapsBody },
]

function listFiles(dir) { return readdirSync(dir).sort().flatMap(name => statSync(join(dir, name)).isDirectory() ? listFiles(join(dir, name)) : [join(dir, name)]) }
function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex') }

// PLAYWRIGHT_CHROMIUM points at an already-installed Chromium when Playwright's own build isn't downloaded.
const browser = await chromium.launch(process.env.PLAYWRIGHT_CHROMIUM ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM } : {})
for (const doc of DOCS) {
  const source = join(here, `${doc.file}.html`)
  writeFileSync(source, html(doc, doc.body()))
  const tab = await browser.newPage({ viewport: { width: 816, height: 1056 } })
  await tab.goto(`file://${source}`)
  await tab.evaluate(async () => {
    await document.fonts.ready
    if (document.querySelector('.mermaid')) await window.mermaid.run({ querySelector: '.mermaid' })
  })
  await tab.pdf({ path: join(pack, `${doc.file}.pdf`), printBackground: true, preferCSSPageSize: true, tagged: true, outline: true })
  if (process.argv.includes('--png')) {
    mkdirSync(reviewDir, { recursive: true })
    await tab.emulateMedia({ media: 'print' })
    await tab.screenshot({ path: join(reviewDir, `${doc.file}.png`), fullPage: true })
  }
  await tab.close()
  console.log(`Wrote public/compliance/papyrus/${doc.file}.pdf`)
}
await browser.close()

// README for anyone browsing the folder, then checksums over everything published.
const readme = `# Papyrus evidence pack

Release ${manifest.release.version}, image \`${manifest.image.repository}@${manifest.image.digest}\`, built ${manifest.release.date}.

| File | Contents |
| --- | --- |
| \`papyrus-architecture.pdf\` | System boundaries, runtime components, model gateways, integrations, data flows and deployment topology |
| \`papyrus-deployment-requirements.pdf\` | Compute, storage, networking, runtime dependencies, offline constraints and external services |
| \`papyrus-security-controls.pdf\`, \`papyrus-controls-matrix.xlsx\` | NIST SP 800-53 Rev. 5 controls matrix with source evidence |
| \`oscal/papyrus-component-definition.json\` | OSCAL ${manifest.tools.oscal} component definition, validated with oscal-cli ${manifest.tools.oscalCli} |
| \`papyrus-known-gaps.pdf\`, \`papyrus-poam.xlsx\`, \`oscal/papyrus-poam.json\` | Known gaps and remediation plan (POA&M) |
| \`papyrus-supply-chain-evidence.pdf\` | Digests, signature and provenance verification, vulnerability scan summary |
| \`sbom/\` | CycloneDX and SPDX SBOMs for each platform |
| \`supply-chain/\` | OCI index, cosign verification, SLSA provenance bundle, Trivy scans |
| \`index.json\` | Machine-readable summary of this pack |
| \`SHA256SUMS\` | Checksums for every file |

${NOTE}
`
writeFileSync(join(pack, 'README.md'), readme)
const sums = listFiles(pack).filter(path => !path.endsWith('SHA256SUMS')).map(path => `${sha256(path)}  ${relative(pack, path)}`).join('\n') + '\n'
writeFileSync(join(pack, 'SHA256SUMS'), sums)
console.log('Wrote README.md and SHA256SUMS')
