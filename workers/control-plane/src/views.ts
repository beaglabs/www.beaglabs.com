import { PLAN } from './billing'
import { CHAT_STYLES, chatBubbleMarkup } from './chat-bubble'
import type { DnsRecord } from './dns'
import { quickCreateUrl } from './providers/aws'
import { LOGOS } from './providers/logos'
import { PROVIDERS } from './providers/registry'
import type { CredentialField, ProviderEntry } from './providers/types'
import { HOSTED_DOMAIN, HOSTED_PROVIDER } from './hosted'
import { STEP_IDS, STEP_LABELS, canRun, isDone, stepLabel, visibleSteps, type Steps } from './setup'
import type { Account, Deployment } from './services'

export const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** Beag Labs look: neo-brutalism, grid, orange accent, black chrome, white surfaces. */
const STYLES = `
:root{--bg:#FAFAF9;--fg:#111;--muted:#555;--accent:#ff5f1f;--line:#111;--surface:#fff;--pass:#0f7b3f;--fail:#c4161c;--pending:#8a6d00;
--sans:'Work Sans',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;--display:'Roboto Condensed','Arial Narrow',sans-serif}
*{box-sizing:border-box;border-radius:0}
html{color-scheme:light}
body{margin:0;font-family:var(--sans);color:var(--fg);background:var(--bg);
background-image:linear-gradient(#11111110 1px,transparent 1px),linear-gradient(90deg,#11111110 1px,transparent 1px);background-size:32px 32px}
a{color:inherit}
header.chrome{background:#000;color:#fff;border-bottom:3px solid var(--accent)}
header.chrome .in{max-width:1080px;margin:0 auto;padding:14px 16px;display:flex;gap:16px;align-items:center;justify-content:space-between;flex-wrap:wrap}
.brand{font-family:var(--display);font-weight:800;letter-spacing:.04em;text-transform:uppercase;text-decoration:none;font-size:20px}
.brand span{color:var(--accent)}
nav a{color:#fff;text-decoration:none;font-family:var(--mono);font-size:13px;margin-left:16px;text-transform:uppercase}
nav a:hover{color:var(--accent)}
main{max-width:1080px;margin:0 auto;padding:32px 16px 64px}
h1{font-family:var(--display);text-transform:uppercase;font-size:clamp(28px,5vw,44px);line-height:1;margin:0 0 8px}
h2{font-family:var(--display);text-transform:uppercase;font-size:22px;margin:0 0 12px}
.lede{color:var(--muted);max-width:640px;margin:0 0 24px}
.card{background:var(--surface);border:2px solid var(--line);box-shadow:6px 6px 0 0 #111;padding:20px;margin:0 0 24px}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(280px,1fr))}
label{display:block;font-family:var(--mono);font-size:12px;text-transform:uppercase;margin:14px 0 6px}
input,textarea,select{width:100%;font:inherit;padding:10px 12px;border:2px solid var(--line);background:#fff}
textarea{min-height:120px;font-family:var(--mono);font-size:12px}
input:focus,textarea:focus{outline:3px solid var(--accent);outline-offset:0}
.help{font-size:13px;color:var(--muted);margin:6px 0 0}
.btn{display:inline-flex;align-items:center;gap:10px;font-family:var(--mono);font-size:14px;font-weight:700;text-transform:uppercase;text-decoration:none;
cursor:pointer;padding:12px 18px;border:2px solid var(--line);background:var(--accent);color:#111;box-shadow:4px 4px 0 0 #111;transition:box-shadow .15s,transform .15s}
.btn:hover{box-shadow:6px 6px 0 0 #111;transform:translate(-1px,-1px)}
.btn:active{box-shadow:2px 2px 0 0 #111;transform:translate(1px,1px)}
.btn.dark{background:#000;color:#fff}
.btn.light{background:#fff}
.btn svg{width:24px;height:24px;flex:none}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.chip{display:inline-block;font-family:var(--mono);font-size:12px;font-weight:700;text-transform:uppercase;padding:3px 8px;border:2px solid var(--line);background:#fff}
.chip.pass{background:var(--pass);color:#fff}.chip.fail{background:var(--fail);color:#fff}.chip.pending{background:#ffe9a8}
.chip.active{background:var(--pass);color:#fff}.chip.suspended{background:var(--fail);color:#fff}
.notice{border:2px solid var(--line);padding:12px 14px;margin:0 0 20px;background:#fff}
.notice.error{border-color:var(--fail);color:var(--fail);font-weight:600}
.notice.ok{border-color:var(--pass)}
details.dropdown{position:relative;max-width:520px}
details.dropdown summary{list-style:none;cursor:pointer;display:flex;gap:12px;align-items:center;padding:10px 12px;border:2px solid var(--line);background:#fff;box-shadow:4px 4px 0 0 #111;font-weight:600}
details.dropdown summary::-webkit-details-marker{display:none}
details.dropdown summary::after{content:'▾';margin-left:auto}
details.dropdown .menu{position:absolute;z-index:5;left:0;right:0;top:calc(100% + 6px);background:#fff;border:2px solid var(--line);box-shadow:6px 6px 0 0 #111;max-height:420px;overflow:auto}
.menu .group{font-family:var(--mono);font-size:11px;text-transform:uppercase;padding:10px 12px 4px;color:var(--muted)}
.menu a{display:flex;gap:12px;align-items:center;padding:8px 12px;text-decoration:none;border-top:1px solid #eee}
.menu a:hover,.menu a[aria-current]{background:#fff2ea}
.logo{width:32px;height:32px;flex:none;border:1px solid #111}.logo svg{width:100%;height:100%;display:block}
ol.steps{list-style:none;padding:0;margin:0;counter-reset:s}
ol.steps li{display:grid;grid-template-columns:40px 1fr auto;gap:12px;align-items:start;padding:14px 0;border-top:2px solid var(--line)}
ol.steps li:first-child{border-top:0}
ol.steps li::before{counter-increment:s;content:counter(s);font-family:var(--display);font-size:26px;font-weight:800}
.reason{font-size:14px;color:var(--muted);margin:4px 0 0;word-break:break-word}
table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:13px}
th,td{text-align:left;border:2px solid var(--line);padding:8px;vertical-align:top;word-break:break-all}
th{background:#000;color:#fff;text-transform:uppercase;font-size:11px}
.price{font-family:var(--display);font-size:48px;font-weight:800;line-height:1}
.price small{font-size:18px;color:var(--muted)}
.mono{font-family:var(--mono)}
@media (max-width:560px){nav a{margin:0 12px 0 0}ol.steps li{grid-template-columns:28px 1fr}ol.steps li form{grid-column:2}}
`

const MICROSOFT = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>`
const GOOGLE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z"/><path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z"/><path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4z"/><path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3c.9-2.7 3.4-4.7 6.4-4.7z"/></svg>`

/** Served at ORG_NAME_SCRIPT_PATH: live org-name validation and availability on the setup page. */
export const ORG_NAME_SCRIPT_PATH = '/assets/org-name.js'

export const layout = (title: string, body: string, account?: Account | null, options: { byoc?: boolean } = {}) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Papyrus</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Roboto+Condensed:wght@700;800&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>${STYLES}${account ? CHAT_STYLES : ''}</style></head>
<body><header class="chrome"><div class="in"><a class="brand" href="/">Beag Labs <span>/</span> Papyrus</a>
<nav>${account ? `<a href="/deploy">Deployments</a>${options.byoc ? '<a href="/provision">Provision</a>' : ''}<a href="/billing">Billing</a><a href="/logout">Sign out</a>` : `<a href="/login">Sign in</a><a href="/signup">Sign up</a>`}</nav></div></header>
<main>${body}</main>${account ? chatBubbleMarkup() : ''}</body></html>`

const notice = (message?: string | null, kind: 'error' | 'ok' = 'error') => (message ? `<div class="notice ${kind}" role="${kind === 'error' ? 'alert' : 'status'}">${esc(message)}</div>` : '')

const ssoButtons = (verb: string) => `<div class="row" style="margin-top:16px">
<a class="btn light" href="/login/microsoft">${MICROSOFT}${esc(verb)} with Microsoft</a>
<a class="btn light" href="/login/google">${GOOGLE}${esc(verb)} with Google</a></div>`

export const signupPage = (error?: string | null) =>
  layout(
    'Sign up',
    `<h1>Papyrus, hosted by Beag Labs</h1>
<p class="lede">${esc(`$${(PLAN.amountCents / 100).toLocaleString('en-US')}/month per deployment, unlimited users, after a ${PLAN.trialDays}-day free trial.`)} Sign up, add a card and pick your organization name: Papyrus goes live at <span class="mono">your-org.${esc(HOSTED_DOMAIN)}</span>, then you connect Microsoft.</p>
${notice(error)}
<div class="grid"><form class="card" method="post" action="/signup">
<h2>Create your account</h2>
<label for="email">Work email</label><input id="email" name="email" type="email" required autocomplete="email">
<label for="name">Your name</label><input id="name" name="name" autocomplete="name">
<label for="organization">Organization</label><input id="organization" name="organization" autocomplete="organization">
<p style="margin-top:20px"><button class="btn" type="submit">Email me a sign-in link</button></p>
</form>
<div class="card"><h2>Or use your work identity</h2><p class="help">We only read your name and email address.</p>${ssoButtons('Sign up')}
<p class="help" style="margin-top:20px">Already have an account? <a href="/login">Sign in</a>.</p></div></div>`,
  )

export const loginPage = (error?: string | null) =>
  layout(
    'Sign in',
    `<h1>Sign in</h1><p class="lede">To manage your Papyrus deployments and billing.</p>${notice(error)}
<div class="grid"><form class="card" method="post" action="/login">
<label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
<p style="margin-top:20px"><button class="btn" type="submit">Email me a sign-in link</button></p></form>
<div class="card"><h2>Single sign-on</h2>${ssoButtons('Sign in')}</div></div>`,
  )

export const checkEmailPage = (email: string) =>
  layout('Check your email', `<h1>Check your email</h1><div class="card"><p>We sent a sign-in link to <strong>${esc(email)}</strong>. It works once and expires in 20 minutes.</p></div>`)

export const errorPage = (message: string, account?: Account | null) => layout('Error', `<h1>Something's not right</h1>${notice(message)}<p><a class="btn light" href="/">Back</a></p>`, account)

const billingChip = (deployment: Deployment) => {
  const label = deployment.billing_state === 'none' ? 'no subscription' : deployment.stripe_status === 'trialing' ? 'trial' : deployment.billing_state
  return `<span class="chip ${esc(deployment.billing_state)}">${esc(label)}</span>`
}

const deploymentName = (deployment: Deployment) => deployment.hostname ?? `Deployment ${deployment.id.slice(-6)}`

const providerName = (deployment: Deployment) => (deployment.provider === HOSTED_PROVIDER ? 'Hosted by Beag Labs' : deployment.provider ?? '—')

export const billingPage = (account: Account, deployments: Deployment[], message?: string | null, byoc = false) =>
  layout(
    'Billing',
    `<h1>Billing</h1><p class="lede">One subscription per deployment. Cards and invoices live in the Stripe customer portal.</p>${notice(message)}
<div class="grid"><div class="card"><h2>Papyrus</h2><p class="price">$${(PLAN.amountCents / 100).toLocaleString('en-US')}<small>/month per deployment</small></p>
<p>Unlimited users. ${PLAN.trialDays}-day free trial; your card is collected now and first charged when the trial ends. Deploying is allowed during the trial.</p>
<form method="post" action="/billing/checkout"><button class="btn" type="submit">Start ${PLAN.trialDays}-day trial</button></form></div>
<div class="card"><h2>Your deployments</h2>${
      deployments.length === 0
        ? '<p class="help">None yet. Start a trial to create one.</p>'
        : `<table><thead><tr><th>Deployment</th><th>Billing</th><th></th></tr></thead><tbody>${deployments
            .map(
              (d) => `<tr><td>${esc(deploymentName(d))}</td><td>${billingChip(d)}</td><td>${
                d.billing_state === 'none'
                  ? `<form method="post" action="/billing/checkout"><input type="hidden" name="deployment" value="${esc(d.id)}"><button class="btn light" type="submit">Subscribe</button></form>`
                  : `<form method="post" action="/billing/portal"><input type="hidden" name="deployment" value="${esc(d.id)}"><button class="btn light" type="submit">Manage</button></form>`
              }</td></tr>`,
            )
            .join('')}</tbody></table>`
    }</div></div>`,
    account,
    { byoc },
  )

const fieldInput = (field: CredentialField, saved: Record<string, boolean>) => {
  const id = `f_${field.name}`
  const placeholder = field.secret && saved[field.name] ? 'Saved — leave blank to keep' : field.placeholder ?? ''
  const attrs = `id="${id}" name="${esc(field.name)}" ${field.optional || (field.secret && saved[field.name]) ? '' : 'required'} placeholder="${esc(placeholder)}" autocomplete="off" spellcheck="false"`
  const input = field.multiline ? `<textarea ${attrs}></textarea>` : `<input ${attrs} type="${field.secret ? 'password' : 'text'}" value="${field.secret ? '' : esc(field.defaultValue ?? '')}">`
  const help = field.help || field.helpUrl ? `<p class="help">${esc(field.help ?? '')}${field.helpUrl ? ` <a href="${esc(field.helpUrl)}" target="_blank" rel="noopener">Where to find this ↗</a>` : ''}</p>` : ''
  return `<label for="${id}">${esc(field.label)}${field.optional ? ' (optional)' : ''}</label>${input}${help}`
}

/** Field list for one provider, generated from its registry entry. Exported for tests. */
export const credentialForm = (provider: ProviderEntry, saved: Record<string, boolean> = {}) => provider.fields.map((field) => fieldInput(field, saved)).join('\n')

const providerDropdown = (deploymentId: string, selected?: ProviderEntry) => {
  const item = (p: ProviderEntry) =>
    `<a href="/provision?deployment=${encodeURIComponent(deploymentId)}&provider=${encodeURIComponent(p.id)}"${p.id === selected?.id ? ' aria-current="true"' : ''}><span class="logo">${p.logo}</span><span><strong>${esc(p.name)}</strong></span></a>`
  return `<details class="dropdown"${selected ? '' : ' open'}><summary>${selected ? `<span class="logo">${selected.logo}</span>${esc(selected.name)}` : 'Choose where Papyrus runs'}</summary>
<div class="menu"><div class="group">Clouds</div>${PROVIDERS.filter((p) => p.kind === 'cloud').map(item).join('')}
<div class="group">Container platforms</div>${PROVIDERS.filter((p) => p.kind === 'platform').map(item).join('')}</div></details>`
}

export const provisionPage = (input: {
  account: Account
  deployment: Deployment
  provider?: ProviderEntry
  saved: Record<string, boolean>
  awsTemplateUrl: string
  awsPrincipalArn: string
  message?: { text: string; kind: 'error' | 'ok' } | null
}) => {
  const { deployment, provider } = input
  const connectAws =
    provider?.connect === 'aws-role' && deployment.aws_external_id
      ? `<div class="notice"><p style="margin-top:0"><strong>1.</strong> Create the access role in your AWS account (CloudFormation; you review it before creating).</p>
<p><a class="btn dark" target="_blank" rel="noopener" href="${esc(quickCreateUrl({ templateUrl: input.awsTemplateUrl, externalId: deployment.aws_external_id, principalArn: input.awsPrincipalArn }))}">${LOGOS.aws}Connect AWS</a></p>
<p class="help">The role trusts only Beag Labs, only with your ExternalId <span class="mono">${esc(deployment.aws_external_id)}</span>, and only for what the deploy needs. <a href="/aws/connect-template.yaml" target="_blank">View template</a>.</p>
<p style="margin-bottom:0"><strong>2.</strong> When the stack shows CREATE_COMPLETE, paste its <span class="mono">RoleArn</span> output below. We verify it by assuming the role.</p></div>`
      : ''
  return layout(
    'Provision',
    `<h1>Provision</h1><p class="lede">Choose where ${esc(deploymentName(deployment))} runs and connect that account. We check your credentials with a read-only call when you save. They are encrypted and used only to deploy and update this Papyrus.</p>
${input.message ? notice(input.message.text, input.message.kind) : ''}
<div class="card">${providerDropdown(deployment.id, provider)}
${
  provider
    ? `<p class="help" style="margin-top:14px">${esc(provider.blurb)}</p>${connectAws}
<form method="post" action="/provision"><input type="hidden" name="deployment" value="${esc(deployment.id)}"><input type="hidden" name="provider" value="${esc(provider.id)}">
${credentialForm(provider, input.saved)}
<p class="row" style="margin-top:20px"><button class="btn" type="submit">Save and check</button>${deployment.steps.connect.status === 'pass' && deployment.provider === provider.id ? `<a class="btn light" href="/deploy/${esc(deployment.id)}">Continue to deploy →</a>` : ''}</p></form>`
    : ''
}</div>`,
    input.account,
    { byoc: true },
  )
}

export const deployListPage = (account: Account, deployments: Deployment[], byoc = false) =>
  layout(
    'Deployments',
    `<h1>Deployments</h1><p class="lede">Each deployment has its own address and its own subscription.</p>
<div class="card">${
      deployments.length === 0
        ? `<p>No deployments yet.</p><p><a class="btn" href="/billing">Start a ${PLAN.trialDays}-day trial</a></p>`
        : `<table><thead><tr><th>Deployment</th><th>Provider</th><th>Billing</th><th>Setup</th></tr></thead><tbody>${deployments
            .map(
              (d) =>
                `<tr><td><a href="/deploy/${esc(d.id)}">${esc(deploymentName(d))}</a></td><td>${esc(providerName(d))}</td><td>${billingChip(d)}</td><td>${isDone(d.steps) ? '<span class="chip pass">live</span>' : '<span class="chip pending">in progress</span>'}</td></tr>`,
            )
            .join('')}</tbody></table><p style="margin-top:16px"><a class="btn light" href="/billing">Add a deployment</a></p>`
    }</div>`,
    account,
    { byoc },
  )

const dnsTable = (records: DnsRecord[]) =>
  records.length === 0
    ? ''
    : `<h2 style="margin-top:20px">DNS records to create</h2><table><thead><tr><th>Type</th><th>Name</th><th>Value</th><th>Why</th></tr></thead><tbody>${records
        .map((r) => `<tr><td>${esc(r.type)}</td><td>${esc(r.name)}</td><td>${esc(r.value)}</td><td style="word-break:normal">${esc(r.purpose ?? '')}</td></tr>`)
        .join('')}</tbody></table><p class="help">If your DNS is on Cloudflare, set these to "DNS only" (grey cloud).</p>`

/** Pick an org name (hosted, the default): live validation from ORG_NAME_SCRIPT_PATH, plain form post without it. */
const orgNameCard = (deployment: Deployment, byoc: boolean) => `<div class="card"><h2>Choose your organization name</h2>
<p class="help">Papyrus goes live at this address. Lowercase letters, numbers and hyphens, 3–40 characters. It can't be changed later.</p>
<form method="post" action="/deploy/${esc(deployment.id)}/org" data-org-form data-check="/api/org-names/check">
<label for="org">Organization name</label>
<div class="row" style="flex-wrap:nowrap;max-width:560px"><input id="org" name="org" required minlength="3" maxlength="40" pattern="[a-z0-9](?:[a-z0-9\\-]*[a-z0-9])?" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="acme" aria-describedby="org-status"><span class="mono" style="white-space:nowrap">.${esc(HOSTED_DOMAIN)}</span></div>
<p id="org-status" class="help" aria-live="polite"></p>
<p style="margin-top:16px"><button class="btn" type="submit">Go live</button></p></form>
${byoc ? `<p class="help" style="margin-top:16px"><a href="/provision?deployment=${esc(deployment.id)}">Deploy in your own cloud instead</a></p>` : ''}</div>
<script src="${ORG_NAME_SCRIPT_PATH}" defer></script>`

export const setupPage = (account: Account, deployment: Deployment, message?: string | null, options: { byoc?: boolean } = {}) => {
  const steps: Steps = deployment.steps
  const byoc = options.byoc ?? false
  const choosing = !deployment.provider
  const hosted = choosing || deployment.provider === HOSTED_PROVIDER
  if (hosted) {
    const stepIds = visibleSteps('hosted')
    const action = (id: (typeof STEP_IDS)[number]) => {
      if (choosing || !canRun(steps, id)) return ''
      const label = steps[id].status === 'pending' && !steps[id].at ? 'Run' : 'Retry'
      return `<form method="post" action="/deploy/${esc(deployment.id)}/steps/${id}"><button class="btn${steps[id].status === 'pass' ? ' light' : ''}" type="submit">${steps[id].status === 'pass' ? (id === 'deploy' ? 'Redeploy' : 'Recheck') : label}</button></form>`
    }
    const extra = (id: (typeof STEP_IDS)[number]) =>
      id === 'microsoft' && deployment.hostname && canRun(steps, 'microsoft')
        ? `<p class="reason"><a href="https://${esc(deployment.hostname)}/" target="_blank" rel="noopener">Open Papyrus and Connect Microsoft ↗</a> (sign-in stays Microsoft Entra in your own tenant).</p>`
        : ''
    return layout(
      'Setup',
      `<h1>${esc(choosing ? 'Set up Papyrus' : deploymentName(deployment))}</h1>
<p class="lede">Hosted by Beag Labs · Billing ${billingChip(deployment)}${deployment.license_deployment_id ? ` · <span class="mono">${esc(deployment.license_deployment_id)}</span>` : ''}</p>
${notice(message)}${isDone(steps) ? notice(`Papyrus is live at https://${deployment.hostname}/`, 'ok') : ''}
${choosing ? orgNameCard(deployment, byoc) : ''}
<div class="card"><h2>Setup</h2><ol class="steps">${stepIds
        .map(
          (id) => `<li id="${id}"><div><strong>${esc(stepLabel('hosted', id))}</strong> <span class="chip ${steps[id].status}">${steps[id].status}</span>
${steps[id].reason ? `<p class="reason">${esc(steps[id].reason)}</p>` : ''}${extra(id)}</div>${action(id)}</li>`,
        )
        .join('')}</ol></div>`,
      account,
      { byoc },
    )
  }
  return byocSetupPage(account, deployment, message, byoc)
}

/** Bring-your-own-cloud setup page (unchanged from before hosted). */
const byocSetupPage = (account: Account, deployment: Deployment, message: string | null | undefined, byoc: boolean) => {
  const steps: Steps = deployment.steps
  const provider = PROVIDERS.find((p) => p.id === deployment.provider)
  const hostnameLocked = Boolean(deployment.license_deployment_id)
  const action = (id: (typeof STEP_IDS)[number]) => {
    if (id === 'connect') return `<a class="btn light" href="/provision?deployment=${esc(deployment.id)}${provider ? `&provider=${esc(provider.id)}` : ''}">${steps.connect.status === 'pass' ? 'Change' : 'Connect'}</a>`
    if (!canRun(steps, id)) return ''
    const label = steps[id].status === 'pending' && !steps[id].at ? 'Run' : 'Retry'
    return `<form method="post" action="/deploy/${esc(deployment.id)}/steps/${id}"><button class="btn${steps[id].status === 'pass' ? ' light' : ''}" type="submit">${steps[id].status === 'pass' ? (id === 'deploy' ? 'Redeploy' : 'Recheck') : label}</button></form>`
  }
  const extra = (id: (typeof STEP_IDS)[number]) => {
    if (id === 'microsoft' && deployment.hostname && canRun(steps, 'microsoft'))
      return `<p class="reason"><a href="https://${esc(deployment.hostname)}/" target="_blank" rel="noopener">Open Papyrus and Connect Microsoft ↗</a> (sign-in stays Microsoft Entra in your own tenant).</p>`
    return ''
  }
  return layout(
    'Setup',
    `<h1>${esc(deploymentName(deployment))}</h1>
<p class="lede">${provider ? `<span class="logo" style="display:inline-block;vertical-align:middle;margin-right:8px">${provider.logo}</span>${esc(provider.name)} · ` : ''}Billing ${billingChip(deployment)}${deployment.license_deployment_id ? ` · <span class="mono">${esc(deployment.license_deployment_id)}</span>` : ''}</p>
${notice(message)}${isDone(steps) ? notice(`Papyrus is live at https://${deployment.hostname}/`, 'ok') : ''}
<div class="card"><h2>Hostname</h2>
<form method="post" action="/deploy/${esc(deployment.id)}/hostname" class="row"><input name="hostname" required placeholder="papyrus.example.com" value="${esc(deployment.hostname ?? '')}" ${hostnameLocked ? 'readonly' : ''} style="max-width:420px">
${hostnameLocked ? '<span class="help">Bound to the license issued at deploy.</span>' : '<button class="btn light" type="submit">Save</button>'}</form></div>
<div class="card"><h2>Setup</h2><ol class="steps">${STEP_IDS.map(
      (id) => `<li><div><strong>${esc(STEP_LABELS[id])}</strong> <span class="chip ${steps[id].status}">${steps[id].status}</span>
${steps[id].reason ? `<p class="reason">${esc(steps[id].reason)}</p>` : ''}${extra(id)}</div>${action(id)}</li>`,
    ).join('')}</ol>${dnsTable(deployment.dnsRecords)}</div>`,
    account,
    { byoc },
  )
}

/** Live org-name check: lowercases as you type, then asks the server (syntax, reserved list, uniqueness). Plain ES2020. */
export const ORG_NAME_JS = `(function () {
  var form = document.querySelector('[data-org-form]')
  if (!form) return
  var input = form.querySelector('input[name="org"]')
  var status = document.getElementById('org-status')
  var button = form.querySelector('button[type="submit"]')
  var timer = null
  var seq = 0
  function show(text, ok) {
    status.textContent = text
    status.style.color = ok === true ? 'var(--pass)' : ok === false ? 'var(--fail)' : ''
    if (button) button.disabled = ok === false
  }
  function check() {
    var name = input.value.trim().toLowerCase()
    if (input.value !== name) input.value = name
    if (!name) return show('', null)
    var mine = ++seq
    show('Checking ' + name + '…', null)
    fetch(form.getAttribute('data-check') + '?name=' + encodeURIComponent(name), { headers: { accept: 'application/json' }, credentials: 'same-origin' })
      .then(function (r) { return r.json() })
      .then(function (body) { if (mine === seq) show(body.reason || '', body.available === true) })
      .catch(function () { if (mine === seq) show('', null) })
  }
  input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(check, 250) })
})()
`
