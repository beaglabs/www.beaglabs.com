// Build the Beag Labs solution briefs (Letter PDFs) into public/briefs.
//
//   node scripts/briefs/build.mjs            # both briefs
//   node scripts/briefs/build.mjs --png      # also write page PNGs to scripts/briefs/out for review
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const outDir = join(root, 'public', 'briefs')
const reviewDir = join(here, 'out')

// The homepage hero's field: orange and white dots on black, picked at random from the site's palette.
const DOT_COLORS = ['#ff5f1f', '#ff8a5c', '#ffb894', '#ffffff', '#ffc9b0']
function dots(width, height, seed, spacing = 15, radius = 6.4) {
  let s = seed
  const rand = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296)
  let circles = ''
  for (let y = spacing / 2; y < height; y += spacing)
    for (let x = spacing / 2; x < width; x += spacing)
      circles += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${DOT_COLORS[Math.floor(rand() * DOT_COLORS.length)]}"/>`
  return `<svg class="dots" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#000"/>${circles}</svg>`
}

const page = (brief, n, total, body) => `
<section class="page">
  <header class="top">
    <div class="brand"><span class="mark">B_</span><span class="brand-name">BEAG LABS</span></div>
    <div class="crumbs"><span>Solution brief</span><span class="slash">/</span><span>${brief}</span><span class="slash">/</span><span>${String(n).padStart(2, '0')} of ${String(total).padStart(2, '0')}</span></div>
  </header>
  <div class="body">${body}</div>
  <footer class="foot"><span>Beag Labs, Inc. · beaglabs.com</span><span class="tag">Superintelligent solutions for higher stakes.</span></footer>
</section>`

const cards = (items, cls = '') => items.map(([title, text], i) => `
  <div class="card ${cls}"><span class="num">${String(i + 1).padStart(2, '0')}</span><h3>${title}</h3><p class="s">${text}</p></div>`).join('')

const loop = ({ inputs, title, sub, runtime, steps, outputs }) => `
  <div class="flow">
    <div class="col"><h4>INPUTS</h4>${inputs.map((i) => `<div class="item">${i}</div>`).join('')}</div>
    <div class="arrow">→</div>
    <div class="core"><div class="title">${title}</div><div class="sub">${sub}</div>
      <div class="inner"><div class="label">${runtime}</div><div class="steps" style="grid-template-columns:repeat(${steps.length},1fr)">${steps.map((s) => `<div>${s}</div>`).join('')}</div></div></div>
    <div class="arrow">→</div>
    <div class="col"><h4>OUTPUTS</h4>${outputs.map((i) => `<div class="item">${i}</div>`).join('')}</div>
  </div>`

const banner = (seed, eyebrow, line, text) => `
  <div class="banner">${dots(736, 150, seed)}<div class="say"><div class="eyebrow">${eyebrow}</div><div class="line">${line}</div><p>${text}</p></div></div>`

const band = (points) => `<div class="band">${points.map(([b, t]) => `<div><b>${b}</b><span>${t}</span></div>`).join('')}</div>`

const cta = (line, alt, label, sub) => `
  <div class="spacer"></div>
  <div class="cta"><div><div class="eyebrow">NEXT STEP</div><div class="line">${line}</div><div class="alt">${alt}</div></div>
  <a class="btn" href="https://beaglabs.com/contact">${label} →<small>${sub}</small></a></div>`

const company = `
  <table class="facts"><tr>
    <td><span class="k">Entity</span>Beag Labs, Inc.</td>
    <td><span class="k">UEI</span>CDQ1WLGN41X6</td>
    <td><span class="k">CAGE</span>22QH1</td>
    <td><span class="k">NAICS</span>541511 · 541512 · 541715</td>
    <td><span class="k">Status</span>SAM active · Small Disadvantaged Business · Awardable on Tradewinds Solutions Marketplace</td>
  </tr></table>`

// ---------------------------------------------------------------------------
// Papyrus
// ---------------------------------------------------------------------------
const PAPYRUS = 'Papyrus'
const papyrus = [
  page(PAPYRUS, 1, 4, `
    <div class="hero">
      <div>
        <span class="chip">Product overview</span>
        <h1 class="cover">Backoffice super&shy;intelligence <span class="o">harness.</span></h1>
        <div class="kicker">Papyrus by Beag Labs · Customer-hosted software</div>
        <p class="lead">A deployable AI execution platform that enables organizations to automate complex back-office operations across existing systems of record using configurable data models, durable agents, human approvals, and governed workflows.</p>
      </div>
      <div class="panel">${dots(300, 360, 7)}<div class="emblem mark-img"><img src="papyrus-mark.jpg" alt="Papyrus"></div><div class="caption">Your cloud / your data / your rules</div></div>
    </div>

    <div class="sec">The problem</div>
    <div class="grid g3">${cards([
      ['Work lives between systems', 'Invoices, cases and approvals move across ERPs, inboxes, spreadsheets and terminals that were never designed to talk to each other.'],
      ['Agents without a boundary', 'Most AI tools act from a vendor cloud, outside your identity, data and approval controls, with no record of why they acted.'],
      ['Replacement is not an option', 'Systems of record carry years of configuration and policy. Rip-and-replace programs stall before they deliver.'],
    ])}</div>

    <div class="sec">What Papyrus does</div>
    <div class="grid g4">${cards([
      ['Model', '<b>Classes</b> define your own record types: entities, vendors, cases, assets, mapped to the systems that hold them.'],
      ['Connect', 'Dynamics 365, NetSuite, Odoo, SharePoint and mainframes stay authoritative. Papyrus reaches them through scoped connections.'],
      ['Execute', 'Durable agents and workflows run multi-step operations with checkpoints, retries, schedules and error handling.'],
      ['Govern', 'Consequential actions pause for a human approval. Every action is recorded, so decisions can be reconstructed.'],
    ], 'shadow')}</div>

    <div class="sec">Where it sits</div>
    ${loop({
      inputs: ['ERP + finance systems', 'Documents + email', 'Forms + requests', 'Legacy applications'],
      title: 'Papyrus', sub: 'Data model / approvals / audit', runtime: 'Governed agent runtime',
      steps: ['Classes', 'Agents', 'Workflows', 'Apps + forms', 'Approvals'],
      outputs: ['Posted records', 'Routed exceptions', 'Internal apps', 'Audit evidence'],
    })}
    <div class="spacer"></div>`),

  page(PAPYRUS, 2, 4, `
    <span class="chip">How it works</span>
    <h1>Model the business.<br>Run the <span class="o">work.</span></h1>
    <p class="lead">Papyrus pairs a configurable data model with durable agents. Agents understand what a vendor, an entity or a case is in your organization, then carry the work across the systems that hold it, stopping for people where policy says they must.</p>

    <div class="sec">The platform</div>
    <div class="grid g3">${cards([
      ['Classes', 'Your own record types with fields, relationships and source identities, created without code and kept in sync with connected systems.'],
      ['Resources', 'One catalog of every record, file and ID across connected systems, so people and agents find the same thing the same way.'],
      ['Factory apps', 'Describe a process and agents build the forms, dashboards and internal apps for it. Drafts publish only after review.'],
      ['Workflows', 'A visual, top-to-bottom builder for triggers, branches, schedules and approvals. Agents can propose workflows for you to accept.'],
      ['Durable agents', 'Long-running sessions with memory, schedules and signals that survive restarts. Model-independent by design.'],
      ['Connectors', 'MCP-based, scoped tool access to external systems, with each connection tested and approved before it goes live.'],
    ], 'shadow')}</div>

    <div class="sec">Governed execution loop</div>
    ${loop({
      inputs: ['Invoices + documents', 'System events', 'Email + forms', 'Schedules'],
      title: 'Human authority', sub: 'Policy / approvals / accountability', runtime: 'Agent runtime',
      steps: ['Read', 'Resolve', 'Reconcile', 'Propose', 'Write back'],
      outputs: ['Updated records', 'Exceptions routed', 'Decision briefs', 'Audit trail'],
    })}
    ${band([
      ['Agents propose. People approve.', 'External side effects cross an approval before they happen.'],
      ['Your models, your gateways.', 'Point Papyrus at the model endpoints you have approved.'],
      ['Durable by default.', 'Work checkpoints and resumes after failures or restarts.'],
      ['Evidence built in.', 'Actions land in an append-only, hash-chained record.'],
    ])}

    <div class="sec">Built for operators</div>
    <div class="grid g3">${cards([
      ['Ask in plain words', 'Staff start from Home and describe what they need. Papyrus finds the records, drafts the work and shows its sources.'],
      ['Exceptions, not everything', 'Routine steps run on their own. Only the cases that need judgment reach a person, with the evidence attached.'],
      ['Change without a release', 'Add a field, a form or a workflow step in the product. No code deployment, no vendor ticket.'],
    ], 'tint')}</div>
    <div class="spacer"></div><div style="height:22px"></div>`),

  page(PAPYRUS, 3, 4, `
    <span class="chip">Deployment + trust</span>
    <h1>Runs inside <span class="o">your boundary.</span></h1>
    <p class="lead">Papyrus is customer-hosted software. It ships as a hardened container that runs in your own cloud account or data center, signs people in with your Microsoft Entra tenant, and keeps your records where they already are.</p>

    <div class="sec">Deployment options</div>
    <div class="grid g3">
      <div class="card shadow"><span class="num">01</span><h3>Commercial</h3><p class="s">Runs in your own cloud account.</p><ul class="ticks">
        <li>Deploys into your AWS or Azure account</li><li>Sign-in through your own Microsoft Entra app</li><li>Starts with a scoped pilot</li><li>Updates delivered as signed images</li></ul></div>
      <div class="card shadow"><span class="num">02</span><h3>Government cloud</h3><p class="s">Deployed with our team.</p><ul class="ticks">
        <li>GCC and GCC High Microsoft tenants</li><li>AWS GovCloud or Azure Government</li><li>Deployment profile set per environment</li><li>Runbook and customer-controlled handoff</li></ul></div>
      <div class="card dark"><span class="num">03</span><h3>DoD + disconnected</h3><p class="s">A dedicated DoD container.</p><ul class="ticks">
        <li>DoD Microsoft cloud for sign-in and Graph</li><li>Signed offline license, verified locally</li><li>No callback to Beag Labs</li><li>Same features as commercial</li></ul></div>
    </div>

    <div class="sec">Security controls</div>
    <div class="grid g3">${cards([
      ['Entra-native identity', 'Microsoft Entra application roles are the only authority. No local accounts or separate role database.'],
      ['Sandboxed execution', 'Agent code runs in a network-denied sandbox with filesystem isolation. Secrets come only from vault or managed identity.'],
      ['Action ledger + approval', 'Every external action moves from proposal to human approval to ledger to executor before it happens.'],
      ['Hash-chained audit', 'Integration and action events form an append-only SHA-256 chain, ready for review and incident response.'],
      ['Signed licensing', 'Licenses are signed with an HSM-held key and verified inside the deployment, online or fully offline.'],
      ['Hardened image', 'Built on Chainguard Wolfi, runs as non-root, ships with an SBOM, and is signed with Cosign on every release.'],
    ])}</div>

    <div class="sec">Works with what you run</div>
    <div class="pills">${['Microsoft Entra ID', 'Microsoft 365', 'SharePoint', 'Teams', 'Exchange', 'Dynamics 365', 'Oracle NetSuite', 'Odoo', 'Mainframes + terminals', 'SOAP / XML services', 'AWS + GovCloud', 'Azure + Azure Government'].map((p) => `<span>${p}</span>`).join('')}</div>

    <div class="sec">One image</div>
    ${banner(33, 'SAME PRODUCT, EVERY ENVIRONMENT', 'One codebase. Three ways to run it.', 'Commercial, government cloud and DoD deployments run the same Papyrus build. Only the identity cloud and the licensing change, so what you pilot is what you field.')}
    <div class="spacer"></div>
    <div class="note" style="margin-bottom:22px"><b>Authorization note.</b> Papyrus's identity, sandboxing, approval-ledger and audit design support a customer's own NIST CSF 2.0 and AI RMF programs. Papyrus is not, by itself, an authorization to operate or a claim of FedRAMP, DoD IL4/IL6 or other accreditation; risk assessment and authorization rest with the deploying organization.</div>`),

  page(PAPYRUS, 4, 4, `
    <span class="chip">In practice</span>
    <h1>Automate what happens<br><span class="o">between systems.</span></h1>
    <p class="lead">Start with one process that crosses systems and still depends on people moving data by hand. Papyrus takes the routine path end to end and hands people only the decisions.</p>

    <div class="sec">Illustrative workflow: a multi-entity invoice</div>
    <div class="chev grid g5">${cards([
      ['Ingest', 'Receive the invoice and supporting evidence from email or upload.'],
      ['Resolve', 'Link supplier and legal entities through Classes.'],
      ['Reconcile', 'Check allocations against purchase orders and source records.'],
      ['Approve', 'Pause exceptions for a named approver, with evidence attached.'],
      ['Write back', 'Post the authorized result into the original ERP.'],
    ])}</div>

    <div class="sec">Where teams start</div>
    <div class="grid g4">${cards([
      ['Payables + receivables', 'Invoice intake, matching, approvals and payment requests across entities.'],
      ['Documents + casework', 'Turn PDFs, forms and office files into structured, reviewable work.'],
      ['Legacy access', 'Give terminals and SOAP/XML services modern APIs and browser screens.'],
      ['Internal apps', 'Forms, dashboards and trackers for the processes you already run.'],
    ], 'shadow')}</div>

    <div class="sec">The first 60–90 days</div>
    <div class="timeline">
      <div><h3>Frame</h3><p class="s">Confirm users, boundary, Entra tenant, deployment profile and acceptance criteria.</p></div>
      <div><h3>Deliver</h3><p class="s">Model the Classes, connect the systems and build the workflow against real cases.</p></div>
      <div><h3>Validate</h3><p class="s">Test identity, approvals, audit trail, failure handling and operator usability.</p></div>
      <div><h3>Transfer</h3><p class="s">Hand over the runbook, deployment assets and documentation to your team.</p></div>
    </div>

    <div class="sec">What you get</div>
    <div class="grid g4">${cards([
      ['Fewer handoffs', 'Routine steps run end to end without re-keying.'],
      ['Clear traceability', 'A record of every decision, change and approval.'],
      ['Your stack, kept', 'Systems of record stay in place and in charge.'],
      ['Room to grow', 'Add Classes, apps and workflows without a rebuild.'],
    ], 'tint')}</div>
    ${cta('Put Papyrus on a real workflow.', 'Talk to us about a pilot · james@beaglabs.com', 'Book a walkthrough', 'beaglabs.com/contact')}`),
]

// ---------------------------------------------------------------------------
// Beag Labs services
// ---------------------------------------------------------------------------
const SERVICES = 'Beag Labs services'
const services = [
  page(SERVICES, 1, 4, `
    <div class="hero">
      <div>
        <span class="chip">Firm overview</span>
        <h1 class="cover">We build super&shy;intelligent <span class="o">solutions.</span></h1>
        <div class="kicker">Advanced solutions for federal and SLED</div>
        <p class="lead">Our firm uses deep expertise and solutioneering paired with superintelligent agents to deploy advanced solutions for federal and SLED. We work the hard problem with your team, then deliver it as running software inside your environment.</p>
      </div>
      <div class="panel">${dots(300, 360, 21)}<div class="emblem word">B_</div><div class="caption">Understand / build / run</div></div>
    </div>

    <div class="sec">What we do</div>
    <div class="grid g3">${cards([
      ['Understand the problem', 'We start inside the mission: the process, the data, the policy and the people. We test ideas against real cases before anything is built.'],
      ['Build what works', 'Engineers and agents deliver working systems: automations, apps and integrations, not slideware or a proof of concept that stops.'],
      ['Run and improve', 'We stay through deployment, measure the results and keep improving. Your team gets the evidence, the code and the runbook.'],
    ], 'shadow')}</div>

    <div class="sec">Who we serve</div>
    <div class="grid g4">${cards([
      ['Federal agencies', 'Civilian and defense programs that need AI inside their security boundary.'],
      ['State + local', 'Departments modernizing public works, finance, permitting and casework.'],
      ['Education', 'Institutions running complex administration on aging systems.'],
      ['Primes + partners', 'Teams that need a delivery partner for an AI work package.'],
    ])}</div>

    <div class="sec">Company</div>
    ${company}
    <div class="spacer"></div>
    <div class="strip" style="margin-bottom:22px">
      <div><div class="k">Delivery</div><div class="v">Expert-led, agent-accelerated</div></div>
      <div><div class="k">Product</div><div class="v">Papyrus</div></div>
      <div><div class="k">Deploys</div><div class="v">Inside your boundary</div></div>
    </div>`),

  page(SERVICES, 2, 4, `
    <span class="chip">Operating model</span>
    <h1>Expert-led.<br>Agent-<span class="o">accelerated.</span></h1>
    <p class="lead">Our engineers own understanding of the mission, the approvals and accountability for delivery. Superintelligent agents do the heavy lifting in between: research, analysis, implementation, testing and documentation, inside a controlled and reviewed workflow.</p>

    <div class="sec">How we work</div>
    <div class="grid g5">${cards([
      ['Discover', 'Mission context, constraints, stakeholders and systems.'],
      ['Prototype', 'Test the approach on real data and real cases, fast.'],
      ['Build', 'Implementation, integration, tests and docs, accelerated by agents.'],
      ['Validate', 'Human review, security checks, evidence and acceptance.'],
      ['Deploy + run', 'Hardening, rollout, enablement and continuous improvement.'],
    ])}</div>

    <div class="sec">Governed delivery loop</div>
    ${loop({
      inputs: ['Requirements', 'Systems', 'Data', 'Constraints'],
      title: 'Beag Labs engineers', sub: 'Problem ownership / approvals / delivery accountability', runtime: 'Superintelligent agent runtime',
      steps: ['Research', 'Analysis', 'Build', 'Test generation', 'Documentation'],
      outputs: ['Working software', 'Integration assets', 'Review evidence', 'Handoff material'],
    })}
    ${band([
      ['Human approval.', 'Engineers review and approve key steps and outputs.'],
      ['Your approved tools.', 'Work runs in your environment with your approved models.'],
      ['Tracked work.', 'Every change is versioned, attributable and auditable.'],
      ['Review-ready outputs.', 'Documentation and evidence ship with the system.'],
    ])}

    <div class="sec">What customers get</div>
    <div class="grid g4">${cards([
      ['Faster iteration', 'Deliver more, sooner, with agent acceleration.'],
      ['Better traceability', 'A clear record of decisions, changes and evidence.'],
      ['Practical handoff', 'Reusable artifacts and documented workflows.'],
      ['Mission-fit outputs', 'Built for your constraints and requirements.'],
    ], 'shadow')}</div>
    <div class="spacer"></div>
    ${banner(57, 'THE DIFFERENCE', 'Agents do the work. People own it.', 'Every engagement pairs senior engineers with superintelligent agents, so work moves at machine speed while decisions, approvals and accountability stay with people.')}
    <div style="height:22px"></div>`),

  page(SERVICES, 3, 4, `
    <span class="chip">Solution areas</span>
    <h1>Four ways we put<br>agents <span class="o">to work.</span></h1>
    <p class="lead">Each area starts from systems you already own. We connect them, build practical ways for your team to use them, and keep people in charge of the decisions that matter.</p>
    <div style="display:grid;gap:10px;margin-top:16px">
      ${[
        ['01', 'Document automation', 'Documents → structured work', 'Turn PDFs, forms and office files into structured information, reviewable actions and repeatable workflows.', ['Read source documents', 'Extract and normalize fields', 'Review evidence and approve'], 'Grant files, permits, claims, invoices, contracts'],
        ['02', 'Internal applications', 'Requirements → working apps', 'Create the apps, forms and dashboards for processes your organization already runs, generated from a description and refined with your team.', ['Describe the process', 'Generate usable interfaces', 'Validate, deploy, iterate'], 'Intake portals, trackers, review queues, reporting'],
        ['03', 'Legacy modernization', 'Legacy systems → modern services', 'Make terminals and SOAP/XML services usable through modern APIs and browser interfaces, while systems of record stay in place.', ['Connect existing systems', 'Expose governed APIs', 'Give operators a better UX'], 'Mainframe screens, 3270 terminals, SOAP services'],
        ['04', 'Back-office operations', 'Processes → governed automation', 'Automate work that spans finance, procurement and operations with Papyrus: a data model, durable agents and human approvals.', ['Model the records', 'Automate the routine path', 'Route exceptions to people'], 'Payables, receivables, reconciliation, case management'],
      ].map(([n, title, result, copy, steps, examples], i) => `
        <div class="card ${i === 3 ? 'dark' : 'shadow'}" style="display:grid;grid-template-columns:1.15fr 1fr 0.85fr;gap:16px;padding:12px 14px">
          <div><span class="num">${n} / ${result}</span><h3 style="font-size:19px">${title}</h3><p class="s">${copy}</p></div>
          <div><span class="num">How it runs</span><ul class="ticks">${steps.map((s) => `<li>${s}</li>`).join('')}</ul></div>
          <div><span class="num">Typical work</span><p class="s" style="margin-top:6px">${examples}</p></div>
        </div>`).join('')}
    </div>
    <div class="sec">Every engagement includes</div>
    <div class="grid g4">${cards([
      ['Discovery memo', 'The problem, the systems involved and the approach we recommend.'],
      ['Working software', 'Running in your environment, not a demo on our laptop.'],
      ['Deployment assets', 'Infrastructure, configuration and a runbook your team can own.'],
      ['Evidence package', 'Tests, review records and documentation for your approvers.'],
    ], 'tint')}</div>
    <div class="spacer"></div><div style="height:22px"></div>`),

  page(SERVICES, 4, 4, `
    <span class="chip">Engagement</span>
    <h1>Start bounded.<br>Scale on <span class="o">evidence.</span></h1>
    <p class="lead">We operate within your program, security and governance structure and own a bounded technical outcome, not generic staff augmentation. A successful first engagement earns the next, larger one.</p>

    <div class="sec">Ways to engage</div>
    <div class="grid g3">
      <div class="card shadow"><span class="num">01</span><h3>Solution sprint</h3><p class="s">A short, focused look at one problem.</p><ul class="ticks"><li>Process and systems walkthrough</li><li>Working prototype on real cases</li><li>Recommendation and cost to deliver</li></ul></div>
      <div class="card shadow"><span class="num">02</span><h3>Initial work package</h3><p class="s">60–90 days to a governed, working deployment.</p><ul class="ticks"><li>Deployed inside your boundary</li><li>Built and tested against acceptance criteria</li><li>Runbook, evidence and handoff</li></ul></div>
      <div class="card dark"><span class="num">03</span><h3>Production + operations</h3><p class="s">Scale what worked, and keep it running.</p><ul class="ticks"><li>More processes, entities and users</li><li>Monitoring and continuous improvement</li><li>Papyrus licensing and support</li></ul></div>
    </div>

    <div class="sec">How we operate</div>
    <div class="grid g4">${cards([
      ['Program-aligned', 'Scoped to a funded program, task order, pilot or requirement.'],
      ['Boundary-aligned', 'Access, data, models and tools follow your approved environment.'],
      ['Outcome-owned', 'We own implementation, tests, deployment, docs and handoff.'],
      ['Scale-earned', 'Each package creates evidence for the next assignment.'],
    ], 'tint')}</div>

    <div class="sec">Buy and contract</div>
    ${company}
    <div class="grid g2" style="margin-top:9px">
      <div class="card"><h3>Contact</h3><p class="s"><b>James Bohrman</b>, Founder &amp; CEO · james@beaglabs.com · beaglabs.com/contact</p></div>
      <div class="card"><h3>Commercial</h3><p class="s">Commercial teams run Papyrus in their own AWS or Azure account, starting with a pilot.</p></div>
    </div>
    ${cta('Bring us the hard problem.', 'We will come back with an approach, a prototype plan and a path to production.', 'Start a project', 'beaglabs.com/contact')}`),
]

const html = (title, pages) => `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><link rel="stylesheet" href="brief.css"></head><body>${pages.join('')}</body></html>`

const BRIEFS = [
  { file: 'papyrus-solution-brief', title: 'Papyrus Solution Brief · Beag Labs', pages: papyrus },
  { file: 'beag-labs-solution-brief', title: 'Beag Labs Solution Brief', pages: services },
]

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
for (const brief of BRIEFS) {
  const source = join(here, `${brief.file}.html`)
  writeFileSync(source, html(brief.title, brief.pages))
  const tab = await browser.newPage({ viewport: { width: 816, height: 1056 } })
  await tab.goto(`file://${source}`)
  await tab.evaluate(() => document.fonts.ready)
  await tab.pdf({ path: join(outDir, `${brief.file}.pdf`), width: '8.5in', height: '11in', printBackground: true, preferCSSPageSize: true })
  if (process.argv.includes('--png')) {
    mkdirSync(reviewDir, { recursive: true })
    const sections = await tab.$$('section.page')
    for (const [i, section] of sections.entries()) await section.screenshot({ path: join(reviewDir, `${brief.file}-${i + 1}.png`) })
  }
  await tab.close()
  console.log(`Wrote public/briefs/${brief.file}.pdf`)
}
await browser.close()
