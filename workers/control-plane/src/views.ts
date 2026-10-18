import { isTrialing, trialStatus } from './billing'
import { PLATFORM_MONTHLY_USD, PRICE_ROWS, PRICE_SUMMARY, SIZE_TABLE_CAPTION, TRIAL_DAYS, sizeRows, type SizeRow, usageLine, type MonthUsage, type PriceRow } from './pricing'
import { eventJson, type EventRow } from './events'
import { HOSTED_DOMAIN, HOSTED_PROVIDER } from './hosted'
import { LOGO_PATHS } from './logo'
import { quickCreateUrl } from './providers/aws'
import { LOGOS } from './providers/logos'
import { PROVIDERS } from './providers/registry'
import type { CredentialField, ProviderEntry } from './providers/types'
import { confirmNameFor } from './lifecycle-model'
import { LEGAL } from './legal'
import type { AdminApproval } from './microsoft'
import type { Account, Deployment } from './services'
import { SUPPORT_STYLES, supportCardMarkup, supportPageCard } from './support'
import { DEPLOY_SCRIPT_PATH, renderDetail, renderList } from './ui/ssr'
import { DEPLOY_STYLES } from './ui/styles'
import type { DeploymentView, ListPayload } from './ui/types'

export const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** The approved "Console" look: black sidebar, grid surface, square corners, 2px #111 borders, hard shadows, #ff5f1f. */
const STYLES = `
:root{--bg:#FAFAF9;--ink:#111;--fg:#111;--muted:#555;--soft:#999;--line:#111;--accent:#ff5f1f;--accent-soft:#FFF3E6;--ok:#16a34a;--pass:#0f7b3f;--fail:#c4161c;
--sans:'Work Sans',system-ui,sans-serif;--mono:'JetBrains Mono',ui-monospace,monospace;--display:'Roboto Condensed','Arial Narrow',sans-serif}
*{box-sizing:border-box;margin:0;padding:0;border-radius:0}
html{color-scheme:light}
body{background:var(--bg);font-family:var(--sans);color:var(--ink);font-size:15px;line-height:1.45}
a{color:inherit}
.grid-bg{background-color:var(--bg);background-image:linear-gradient(#11111110 1px,transparent 1px),linear-gradient(90deg,#11111110 1px,transparent 1px);background-size:24px 24px}
.mono{font-family:var(--mono)}
.disp{font-family:var(--display);font-weight:800;text-transform:uppercase;letter-spacing:.3px}
.muted{color:var(--muted)}
.kicker{font:12px var(--mono);color:var(--muted);text-transform:uppercase;letter-spacing:.3px}
.btn{display:inline-flex;align-items:center;gap:8px;font:600 13px var(--sans);border:2px solid var(--ink);padding:9px 14px;background:#fff;color:var(--ink);box-shadow:3px 3px 0 var(--ink);text-decoration:none;cursor:pointer;transition:transform .1s,box-shadow .1s;white-space:nowrap}
.btn:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 var(--ink)}
.btn:active{transform:translate(1px,1px);box-shadow:1px 1px 0 var(--ink)}
.btn:focus-visible,.side a:focus-visible,.filters button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.btn.primary{background:var(--accent)}
.btn.dark{background:#111;color:#fff;box-shadow:3px 3px 0 var(--accent)}
.btn.lg{font-size:15px;padding:11px 18px}
.btn.sm{font-size:12px;padding:5px 10px;box-shadow:2px 2px 0 var(--ink)}
.btn[aria-disabled=true],.btn:disabled{opacity:.45;box-shadow:none;cursor:not-allowed;transform:none}
.btn.danger{background:#fee2e2;border-color:#991b1b;color:#991b1b;box-shadow:3px 3px 0 #991b1b}
details.confirm{position:relative;display:inline-block}
details.confirm>summary{list-style:none}
details.confirm>summary::-webkit-details-marker{display:none}
details.confirm .pop{position:absolute;right:0;top:calc(100% + 8px);z-index:20;width:min(340px,calc(100vw - 32px));background:#fff;border:2px solid var(--ink);box-shadow:4px 4px 0 var(--ink);padding:14px;font-size:14px;white-space:normal}
details.confirm .pop .actions{margin-top:12px;display:flex;gap:8px}
.banner{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 16px;border-bottom:2px solid var(--ink);background:#111;color:#fff;font:600 13px var(--mono);text-transform:uppercase}
.cleanup td,.cleanup th{vertical-align:top}
.btn svg{width:20px;height:20px;flex:none}
.tag{display:inline-block;font:600 11px var(--mono);border:1.5px solid var(--ink);padding:2px 7px;text-transform:uppercase;background:#fff;white-space:nowrap}
.tag.ok{background:#dcfce7}.tag.run{background:var(--accent-soft);border-color:var(--accent);color:#b43c0c}.tag.wait{color:var(--soft);border-color:#bbb}
.tag.err{background:#fee2e2;border-color:#dc2626;color:#991b1b}
.card{background:#fff;border:2px solid var(--ink)}
.card h4{font:700 12px var(--mono);text-transform:uppercase;letter-spacing:.6px;padding:12px 16px;border-bottom:2px solid var(--ink);display:flex;justify-content:space-between;align-items:center;gap:12px}
.card h4 .accent{color:var(--accent)}
.card .body{padding:16px}
.card .body>p+p,.card .body>p+form,.card .body>form+p{margin-top:12px}
.kv{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px dashed #ccc;font-size:14px}.kv:last-of-type{border:0}
.kv span:first-child{color:var(--muted)}.kv span:last-child{text-align:right;word-break:break-word}
.actions{margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.step{display:grid;grid-template-columns:36px 1fr auto;gap:14px;align-items:start;padding:16px 18px;border-bottom:2px solid var(--ink);background:#fff}
.step:last-child{border-bottom:0}
.num{width:36px;height:36px;border:2px solid var(--ink);display:grid;place-items:center;font:700 14px var(--mono);background:#fff}
.num.ok{background:var(--ink);color:#fff}.num.run{background:var(--accent)}.num.err{background:#fee2e2;border-color:#dc2626;color:#991b1b}
.step h5{font-size:15px;font-weight:600}.step p{font-size:13px;color:var(--muted);margin-top:3px}
.step p.reason{font-family:var(--mono);font-size:12px;word-break:break-word}
.step p.reason.err{color:#991b1b}
.step form{display:inline}
.bar{height:10px;border:2px solid var(--ink);background:#fff;margin-top:10px;max-width:420px}.bar div{height:100%;background:var(--accent)}
.lv{font-weight:600;font-size:10.5px;padding:1px 6px;border:1.5px solid #111;white-space:nowrap}
.lv.info{background:#fff}.lv.ok{background:#dcfce7}.lv.warn{background:#FFF3E6;border-color:#ff5f1f;color:#b43c0c}.lv.err{background:#fee2e2;border-color:#dc2626;color:#991b1b}
.log{margin-top:22px}
.log .filters{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
.log .filters button{font:600 10px var(--mono);text-transform:uppercase;border:1.5px solid #111;padding:1px 7px;background:#fff;color:#111;cursor:pointer}
.log .filters button.on{background:#111;color:#fff}
.log .filters .live{font-size:10px;color:var(--ink)}
.log .scroll{max-height:440px;overflow-y:auto;overflow-x:hidden}
.log table{width:100%;border-collapse:collapse;font:12.5px var(--mono)}
.log td{padding:8px 16px;border-bottom:1px dashed #ddd;vertical-align:top}
.log tr:last-child td{border-bottom:0}
.log td.t{color:#999;white-space:nowrap;width:1%}
.log td.s{width:1%;white-space:nowrap}
.log td.src{color:#555;white-space:nowrap;width:1%}
.log td.msg{overflow-wrap:anywhere;word-break:normal;min-width:0}
.log .txt{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden}
.log .open .txt{display:block;-webkit-line-clamp:unset;line-clamp:none}
.log .xp{display:inline-block;margin-top:3px;font:600 10px var(--mono);text-transform:uppercase;letter-spacing:.3px;border:0;background:none;padding:0;color:var(--muted);text-decoration:underline;cursor:pointer}
.log .xp[hidden]{display:none}
.log .xp:hover{color:var(--ink)}
.log .xp:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.log .live.off{color:var(--soft)}
.log tr.empty td{color:var(--muted);padding:18px 16px}
.log .more{padding:12px 16px;border-top:2px solid var(--ink)}
.log .more[hidden]{display:none}
table.list{width:100%;border-collapse:collapse;font-size:14px}
table.list th{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.5px;text-align:left;color:var(--muted);padding:10px 16px;border-bottom:2px solid var(--ink)}
table.list td{padding:12px 16px;border-bottom:1px dashed #ccc;vertical-align:middle;word-break:break-word}
table.list tr:last-child td{border-bottom:0}
label{display:block;font:600 11px var(--mono);text-transform:uppercase;letter-spacing:.4px;margin:14px 0 6px}
label:first-child{margin-top:0}
input,textarea,select{width:100%;font:inherit;font-size:15px;padding:10px 12px;border:2px solid var(--ink);background:#fff;color:var(--ink)}
input[readonly]{background:#f3f2ee;color:var(--muted)}
textarea{min-height:120px;font-family:var(--mono);font-size:12px}
input:focus,textarea:focus,select:focus{outline:3px solid var(--accent);outline-offset:0}
.help{font-size:13px;color:var(--muted);margin-top:6px}
label.check{display:flex;gap:10px;align-items:flex-start;margin:18px 0 0;font:14px/1.4 var(--sans);text-transform:none;letter-spacing:0}
label.check input{width:18px;height:18px;flex:none;margin-top:1px;padding:0;accent-color:var(--accent)}
.notice{border:2px solid var(--ink);padding:12px 14px;margin:0 0 20px;background:#fff;font-size:14px}
.notice.error{border-color:#dc2626;background:#fee2e2;color:#991b1b;font-weight:600}
.notice.ok{border-color:var(--ok);background:#dcfce7}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.plogo{width:32px;height:32px;flex:none;border:1px solid #111;display:inline-block;vertical-align:middle}.plogo svg{width:100%;height:100%;display:block}
details.dropdown{position:relative;max-width:520px}
details.dropdown summary{list-style:none;cursor:pointer;display:flex;gap:12px;align-items:center;padding:10px 12px;border:2px solid var(--ink);background:#fff;box-shadow:3px 3px 0 var(--ink);font-weight:600}
details.dropdown summary::-webkit-details-marker{display:none}
details.dropdown summary::after{content:'▾';margin-left:auto}
details.dropdown .menu{position:absolute;z-index:5;left:0;right:0;top:calc(100% + 6px);background:#fff;border:2px solid var(--ink);box-shadow:6px 6px 0 var(--ink);max-height:420px;overflow:auto}
.menu .group{font:11px var(--mono);text-transform:uppercase;padding:10px 12px 4px;color:var(--muted)}
.menu a{display:flex;gap:12px;align-items:center;padding:8px 12px;text-decoration:none;border-top:1px solid #eee}
.menu a:hover,.menu a[aria-current]{background:var(--accent-soft)}
.dns{width:100%;border-collapse:collapse;font:12px var(--mono);margin-top:10px}
.dns th,.dns td{text-align:left;border:2px solid var(--ink);padding:8px;vertical-align:top;word-break:break-all}
.dns th{background:#111;color:#fff;text-transform:uppercase;font-size:11px}

/* Console shell: the page never scrolls; the sidebar is fixed to the viewport height and main scrolls on its own. */
html:has(body.console-body),body.console-body{height:100%;overflow:hidden}
.console{display:grid;grid-template-columns:232px minmax(0,1fr);height:100vh;height:100dvh;overflow:hidden}
.side{background:#111;color:#bbb;padding:20px 0;display:flex;flex-direction:column;height:100%;min-height:0;min-width:0;overflow:hidden}
.side .brand{flex:none;color:#fff;padding:0 20px 22px;font-size:18px;display:flex;align-items:center;gap:10px;text-decoration:none;min-width:0}
.side .brand img{width:30px;height:30px;border:2px solid #fff;display:block;flex:none}
.side .brand span,.side nav a,.side .acct .who,.side .acct .email{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.side nav{flex:0 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden}
.side nav a{display:block;padding:10px 20px;font-size:14px;border-left:4px solid transparent;text-decoration:none;color:#bbb}
.side nav a:hover{color:#fff}
.side nav a.on{color:#fff;border-left-color:var(--accent);background:#1d1d1d}
.side .sp{flex:1 1 0;min-height:12px}
.side .acct{flex:none;padding:14px 20px 0;border-top:1px solid #2a2a2a;font-size:13px;min-width:0}
.side .acct .who{display:block;color:#ddd}
.side .acct .email{display:block;color:#777}
.side .acct a{display:inline-block;margin-top:10px;color:#777;font:11px var(--mono);text-transform:uppercase;text-decoration:none}
.side .acct a:hover{color:#fff}
main.page{height:100%;min-height:0;min-width:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;background-attachment:local;padding:28px 32px 110px}
.trialbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:2px solid var(--ink);border-left:6px solid var(--accent);padding:7px 12px;margin:-8px 0 20px;font-size:13px}
.trialbar strong{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.5px;background:var(--accent);color:#111;padding:2px 7px}
.trialbar .then{color:var(--muted)}
.trialbar a{margin-left:auto;font:600 11px var(--mono);text-transform:uppercase;text-decoration:none;white-space:nowrap}
.trialbar a:hover{color:var(--accent)}
.price-summary{font-size:13px;color:var(--muted);margin-top:10px}
.usage{font:12px var(--mono);margin-top:8px;padding:8px 10px;background:var(--bg);border:1.5px dashed #bbb}
table.pricing{width:100%;border-collapse:collapse;border:2px solid var(--ink);background:#fff}
table.pricing th,table.pricing td{padding:12px 14px;border-bottom:1px dashed #ccc;text-align:left;vertical-align:top}
table.pricing tr:last-child th,table.pricing tr:last-child td{border-bottom:0}
table.pricing th{font-weight:600;font-size:14px}
table.pricing th small{display:block;font-weight:400;font-size:12.5px;color:var(--muted);margin-top:2px}
table.pricing td{text-align:right;white-space:nowrap}
table.pricing .amt{display:block;font:700 18px var(--mono)}
table.pricing .unit{display:block;font:11px var(--mono);text-transform:uppercase;color:var(--muted)}
table.pricing tr[data-price=platform] .amt{color:var(--accent)}
div.sizes{overflow-x:auto}
table.pricing.sizes thead th{font:700 11px var(--mono);text-transform:uppercase;letter-spacing:.4px;color:var(--muted);border-bottom:2px solid var(--ink);white-space:normal}
table.pricing.sizes thead th+th{text-align:right}
table.pricing.sizes td{text-align:right;font-family:var(--mono);font-size:13px}
table.pricing.sizes tbody th{white-space:nowrap}
table.pricing caption{caption-side:bottom;text-align:left;font-size:12.5px;color:var(--muted);padding-top:8px}
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;margin-bottom:22px;flex-wrap:wrap}
.top h1{font-size:30px;line-height:1.05;word-break:break-word}
.top .right{display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.top .why{flex-basis:100%;text-align:right;font-size:12px;color:var(--muted)}
.cols{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:22px;align-items:start}
.cols>*{min-width:0}
.stack{display:flex;flex-direction:column;gap:18px}
.tiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:18px;align-items:start}
a.dep{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center;padding:16px 18px;border-bottom:2px solid var(--ink);text-decoration:none;background:#fff}
a.dep:last-child{border-bottom:0}
a.dep:hover{background:var(--accent-soft)}
a.dep strong{font:600 15px var(--mono);word-break:break-all}
a.dep small{display:block;color:var(--muted);font-size:13px;margin-top:2px}

/* Signed-out and claim screens */
.solo{min-height:100vh;display:grid;place-items:center;padding:40px 16px}
.panel{width:100%;max-width:460px;background:#fff;border:2px solid var(--ink);box-shadow:8px 8px 0 var(--ink)}
.panel.wide{max-width:560px}
.panel header{background:#111;color:#fff;padding:14px 20px;display:flex;align-items:center;gap:10px;font-size:18px}
.panel header img{width:30px;height:30px;border:2px solid #fff;display:block}
.panel .body{padding:24px 22px}
.panel h1{font-size:28px;line-height:1.05;margin-bottom:8px}
.panel .lede{color:var(--muted);font-size:14px;margin-bottom:18px}
.panel .alt{border-top:2px solid var(--ink);padding:18px 22px;background:var(--bg)}
.panel .alt .btn{width:100%;justify-content:center;margin-top:10px}
.panel .alt .btn:first-of-type{margin-top:0}
.panel .foot{padding:12px 22px;border-top:2px solid var(--ink);font-size:13px;color:var(--muted)}
.full{width:100%;justify-content:center}

@media (max-width:900px){
.console{grid-template-columns:minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}
.side{z-index:20;height:auto;flex-direction:row;flex-wrap:wrap;align-items:center;padding:10px 16px 0;gap:4px 12px}
.side .brand{padding:0 0 8px}
.side nav{order:3;flex:none;width:calc(100% + 32px);margin:0 -16px;display:flex;overflow-x:auto;overflow-y:hidden;border-top:1px solid #2a2a2a}
.side nav a{flex:none;border-left:0;border-bottom:4px solid transparent;padding:10px 14px;overflow:visible}
.side nav a.on{border-bottom-color:var(--accent)}
.side .sp{display:none}
.side .acct{flex:1 1 0;margin-left:auto;border:0;padding:0 0 8px;display:flex;gap:10px;align-items:baseline;justify-content:flex-end}
.side .acct .who{display:none}
.side .acct .email{min-width:0}
.side .acct a{margin:0;flex:none}
main.page{padding:22px 16px 110px}
.cols{grid-template-columns:1fr}
.top .right{justify-content:flex-start}
.top .why{text-align:left}
}
@media (max-width:560px){
.top h1{font-size:24px}
.side .acct .email{display:none}
.trialbar .then{display:none}
table.pricing th,table.pricing td{padding:10px}
table.pricing.sizes th,table.pricing.sizes td{padding:8px 5px;font-size:11.5px}
table.pricing.sizes thead th{font-size:9px;letter-spacing:.2px}
table.pricing.sizes tbody th{white-space:normal}
.step{grid-template-columns:30px 1fr;gap:12px;padding:14px}
.step>.tag{grid-column:2;justify-self:start;grid-row:2}
.num{width:30px;height:30px}
.log td{padding:8px 10px}
.log td.src{display:none}
.card h4{flex-wrap:wrap}
a.dep{grid-template-columns:1fr auto}
a.dep .go{display:none}
}
@media (prefers-reduced-motion:reduce){.btn{transition:none}}
`

const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600;700&family=Roboto+Condensed:wght@600;700;800&display=swap" rel="stylesheet">`

const head = (title: string, extraStyles = '') => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Papyrus</title>
<link rel="icon" type="image/png" href="${LOGO_PATHS.small}">
${FONTS}
<style>${STYLES}${extraStyles}</style></head>`

const logoImg = (alt = '') => `<img src="${LOGO_PATHS.small}" srcset="${LOGO_PATHS.large} 2x" width="30" height="30" alt="${esc(alt)}">`

const MICROSOFT = `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="13" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="13" width="10" height="10" fill="#00A4EF"/><rect x="13" y="13" width="10" height="10" fill="#FFB900"/></svg>`
const GOOGLE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.5z"/><path fill="#34A853" d="M12 23.5c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 23.5z"/><path fill="#FBBC05" d="M5.6 14.2a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4z"/><path fill="#EA4335" d="M12 5.1c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 6.8l3.8 3c.9-2.7 3.4-4.7 6.4-4.7z"/></svg>`

/** Served at ORG_NAME_SCRIPT_PATH: live org-name validation and availability on the claim screen. */
export const ORG_NAME_SCRIPT_PATH = '/assets/org-name.js'

// Shells ---------------------------------------------------------------------------------------------------------------

export type NavItem = 'deployment' | 'billing' | 'team' | 'support' | 'settings'

export const NAV: readonly { id: NavItem; label: string; href: string }[] = [
  { id: 'deployment', label: 'Deployment', href: '/deploy' },
  { id: 'billing', label: 'Billing', href: '/billing' },
  { id: 'team', label: 'Team', href: '/team' },
  { id: 'support', label: 'Support', href: '/support' },
  { id: 'settings', label: 'Settings', href: '/settings' },
]

const accountLabel = (account: Account) => account.organization || account.name || account.email.split('@')[0]

/** Signed-in pages: black sidebar, grid main area, the support card. */
export const consoleLayout = (input: { title: string; account: Account; active: NavItem | null; body: string; scripts?: string[]; styles?: string }) => `${head(input.title, SUPPORT_STYLES + (input.styles ?? ''))}
<body class="console-body"><div class="console">
<aside class="side" aria-label="Papyrus control plane">
<a class="brand disp" href="/deploy">${logoImg()}<span>Papyrus</span></a>
<nav>${NAV.map((item) => `<a href="${item.href}"${item.id === input.active ? ' class="on" aria-current="page"' : ''}>${item.label}</a>`).join('')}</nav>
<div class="sp"></div>
<div class="acct"><span class="who" title="${esc(accountLabel(input.account))}">${esc(accountLabel(input.account))}</span><span class="email" title="${esc(input.account.email)}">${esc(input.account.email)}</span><a href="/logout">Sign out</a></div>
</aside>
<main class="page grid-bg">${input.account.trial ? trialBanner(input.account.trial.trialEnd) : ''}${input.body}</main>
</div>${supportCardMarkup(input.account)}${(input.scripts ?? []).map((src) => `<script src="${esc(src)}" defer></script>`).join('')}</body></html>`

/** Signed-out pages and the org-name claim screen: one centred card on the grid, no sidebar. */
export const soloLayout = (input: { title: string; body: string; wide?: boolean; account?: Account | null; scripts?: string[] }) => `${head(input.title, input.account ? SUPPORT_STYLES : '')}
<body class="grid-bg"><main class="solo"><div class="panel${input.wide ? ' wide' : ''}">
<header class="disp">${logoImg()}<span>Papyrus</span></header>
${input.body}
</div></main>${input.account ? supportCardMarkup(input.account) : ''}${(input.scripts ?? []).map((src) => `<script src="${esc(src)}" defer></script>`).join('')}</body></html>`

const notice = (message?: string | null, kind: 'error' | 'ok' = 'error') => (message ? `<div class="notice ${kind}" role="${kind === 'error' ? 'alert' : 'status'}">${esc(message)}</div>` : '')

const pageTop = (kicker: string, title: string, right = '') =>
  `<div class="top"><div><div class="kicker">${kicker}</div><h1 class="disp">${esc(title)}</h1></div>${right ? `<div class="right">${right}</div>` : ''}</div>`

/** Slim banner at the top of the main area while a deployment is in its free trial. */
export const trialBanner = (trialEnd: string | null, now = Date.now()) => {
  const [, ...rest] = trialStatus(trialEnd, now).split(' · ')
  return `<div class="trialbar" role="status" data-trial-banner><strong>Trial</strong><span>${esc(rest.join(' · ') || 'Free trial')}</span><span class="then">Then $${PLATFORM_MONTHLY_USD}/month platform + usage</span><a href="/billing">Billing →</a></div>`
}

/** The pricing table: one row per charge, from PRICE_ROWS (or another list of rows, e.g. per organization size). */
export const pricingTable = (rows: readonly PriceRow[] = PRICE_ROWS, caption?: string) =>
  `<table class="pricing">${caption ? `<caption>${esc(caption)}</caption>` : ''}<tbody>${rows
    .map((row) => `<tr data-price="${esc(row.id)}"><th scope="row">${esc(row.label)}<small>${esc(row.detail)}</small></th><td><strong class="amt">${esc(row.amount)}</strong><span class="unit">${esc(row.unit)}</span></td></tr>`)
    .join('')}</tbody></table>`

/** Estimated monthly total by organization size, computed from the pricing constants. */
export const sizeTable = (rows: readonly SizeRow[] = sizeRows()) => {
  const n = (value: number) => value.toLocaleString('en-US')
  const cents = (value: number) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `<div class="sizes"><table class="pricing sizes" data-size-table><caption>${esc(SIZE_TABLE_CAPTION)}</caption><thead><tr><th scope="col">Organization size</th><th scope="col">Agent-hours / month</th><th scope="col">Estimated monthly total</th><th scope="col">Effective cost per user/month</th></tr></thead><tbody>${rows
    .map((row) => `<tr><th scope="row">${n(row.users)} users</th><td>${n(row.agentHours)}</td><td>$${n(row.monthlyTotal)}</td><td>$${cents(row.perUser)}</td></tr>`)
    .join('')}</tbody></table></div>`
}

// Signed out -----------------------------------------------------------------------------------------------------------

const ssoButtons = (verb: string) => `<a class="btn" href="/login/microsoft">${MICROSOFT}${esc(verb)} with Microsoft</a>
<a class="btn" href="/login/google">${GOOGLE}${esc(verb)} with Google</a>`

/** `email` prefills the form, e.g. arriving from the beaglabs.com hero with a work email already given. */
export const signupPage = (error?: string | null, email?: string) =>
  soloLayout({
    title: 'Sign up',
    body: `<div class="body"><div class="kicker">Hosted by Beag Labs</div><h1 class="disp">Start your Papyrus</h1>
<p class="lede">${esc(`$250/month platform plus usage, unlimited users, after a ${TRIAL_DAYS}-day free trial.`)} Pick your organization name and Papyrus goes live at <span class="mono">your-org.${esc(HOSTED_DOMAIN)}</span>.</p>
${notice(error)}<form method="post" action="/signup">
<label for="email">Work email</label><input id="email" name="email" type="email" required autocomplete="email"${email ? ` value="${esc(email)}"` : ''}>
<label for="name">Your name</label><input id="name" name="name" autocomplete="name">
<label for="organization">Organization</label><input id="organization" name="organization" autocomplete="organization">
<p style="margin-top:20px"><button class="btn primary lg full" type="submit">Email me a sign-in link</button></p></form></div>
<div class="alt">${ssoButtons('Sign up')}</div>
<div class="foot">Already have an account? <a href="/login">Sign in</a>.</div>`,
  })

export const loginPage = (error?: string | null) =>
  soloLayout({
    title: 'Sign in',
    body: `<div class="body"><div class="kicker">Control plane</div><h1 class="disp">Sign in</h1><p class="lede">Manage your Papyrus deployment, billing and team.</p>${notice(error)}
<form method="post" action="/login"><label for="email">Email</label><input id="email" name="email" type="email" required autocomplete="email">
<p style="margin-top:20px"><button class="btn primary lg full" type="submit">Email me a sign-in link</button></p></form></div>
<div class="alt">${ssoButtons('Sign in')}</div>
<div class="foot">New to Papyrus? <a href="/signup">Sign up</a>.</div>`,
  })

export const checkEmailPage = (email: string) =>
  soloLayout({
    title: 'Check your email',
    body: `<div class="body"><div class="kicker">Magic link sent</div><h1 class="disp">Check your email</h1>
<p class="lede" style="margin-bottom:0">We sent a sign-in link to <strong>${esc(email)}</strong>. It works once and expires in 20 minutes.</p></div>
<div class="foot">Wrong address? <a href="/login">Try again</a>.</div>`,
  })

export const errorPage = (message: string, account?: Account | null) =>
  account
    ? consoleLayout({ title: 'Error', account, active: null, body: `${pageTop('Error', "Something's not right")}${notice(message)}<p><a class="btn" href="/deploy">Back</a></p>` })
    : soloLayout({ title: 'Error', body: `<div class="body"><h1 class="disp">Something's not right</h1>${notice(message)}<p><a class="btn" href="/login">Back</a></p></div>` })

// Shared pieces --------------------------------------------------------------------------------------------------------

const deploymentName = (deployment: Deployment) => deployment.hostname ?? `Deployment ${deployment.id.slice(-6)}`

const providerName = (deployment: Deployment) =>
  deployment.provider === HOSTED_PROVIDER || !deployment.provider ? 'Hosted by Beag Labs' : PROVIDERS.find((p) => p.id === deployment.provider)?.name ?? deployment.provider

const planLabel = (deployment: Deployment) =>
  deployment.billing_state === 'none'
    ? 'None'
    : deployment.billing_state === 'suspended'
      ? 'Suspended'
      : deployment.stripe_status === 'trialing'
        ? 'Trial'
        : 'Active'

const billingButton = (deployment: Deployment, label = 'Manage billing') =>
  deployment.stripe_customer_id
    ? `<form method="post" action="/billing/portal"><input type="hidden" name="deployment" value="${esc(deployment.id)}"><button class="btn" type="submit">${esc(label)}</button></form>`
    : `<form method="post" action="/billing/checkout"><input type="hidden" name="deployment" value="${esc(deployment.id)}"><button class="btn primary" type="submit">Start ${TRIAL_DAYS}-day trial</button></form>`

const NO_USAGE: MonthUsage = { vmHours: 0, executionSeconds: 0 }

const planRows = (deployment: Deployment, usage: MonthUsage | undefined, now = Date.now()) => {
  const trialing = isTrialing(deployment)
  return `<div class="kv"><span>Plan</span><span>Papyrus</span></div>
${trialing ? `<div class="kv"><span>Status</span><span data-trial>${esc(trialStatus(deployment.trial_end, now))}</span></div>` : ''}
${deployment.billing_state === 'suspended' ? `<div class="kv"><span>Status</span><span>Suspended${deployment.stripe_status ? ` · ${esc(deployment.stripe_status.replace(/_/g, ' '))}` : ''}</span></div>` : ''}
${deployment.billing_state === 'none' ? `<div class="kv"><span>Trial</span><span>${TRIAL_DAYS} days free</span></div>` : ''}
<p class="price-summary">${esc(PRICE_SUMMARY)}</p>
${deployment.billing_state === 'none' ? '' : `<p class="usage">${esc(usageLine(usage ?? NO_USAGE, { platform: deployment.billing_state === 'active' && !trialing }))}</p>`}`
}

/** Email support, the same card as /support. */
const helpCard = (account: Account) => supportPageCard(account)

// Deployment pages -----------------------------------------------------------------------------------------------------

/** BYOC only, before the license is issued: the hostname Papyrus will answer on. */
export const hostnameCard = (deployment: Deployment) => {
  const locked = Boolean(deployment.license_deployment_id)
  return `<div class="card" style="margin-bottom:22px"><h4>Hostname</h4><div class="body">
<form method="post" action="/deploy/${esc(deployment.id)}/hostname" class="row"><input name="hostname" required placeholder="papyrus.example.com" value="${esc(deployment.hostname ?? '')}" ${locked ? 'readonly' : ''} style="max-width:420px;flex:1">
${locked ? '<span class="help">Bound to the license issued at deploy.</span>' : '<button class="btn" type="submit">Save</button>'}</form></div></div>`
}

export interface DeploymentPageInput {
  account: Account
  view: DeploymentView
  events: { events: EventRow[]; next: number | null }
  serverTime: string
  message?: string | null
  /** Server-rendered extras above the app (the BYOC hostname form). */
  before?: string
}

/** /deploy/{id}: server-rendered first paint of the Preact app, hydrated by DEPLOY_SCRIPT_PATH. */
export const deploymentPage = (input: DeploymentPageInput) => {
  const body = `${notice(input.message)}${input.before ?? ''}${renderDetail({ payload: { deployment: input.view, serverTime: input.serverTime }, events: { events: input.events.events.map(eventJson), next: input.events.next } })}`
  return consoleLayout({ title: input.view.name, account: input.account, active: 'deployment', body, scripts: [DEPLOY_SCRIPT_PATH], styles: DEPLOY_STYLES })
}

/** The required terms checkbox on the claim card (and the Connect Microsoft dialog, rendered by the client). */
const termsCheckbox = (id: string) =>
  `<label class="check" for="${id}"><input id="${id}" name="terms" type="checkbox" value="accept" required><span>I accept the Papyrus <a href="${LEGAL.termsUrl}" target="_blank" rel="noopener">Terms of Service</a> and <a href="${LEGAL.privacyUrl}" target="_blank" rel="noopener">Privacy Policy</a> for my organization and am authorized to do so</span></label>`

/** Pick an org name (hosted, the default): a centred card, no sidebar. Live validation from ORG_NAME_SCRIPT_PATH. */
export const claimPage = (account: Account, deployment: Deployment, message?: string | null, byoc = false) =>
  soloLayout({
    title: 'Choose your organization name',
    wide: true,
    account,
    scripts: [ORG_NAME_SCRIPT_PATH],
    body: `<div class="body"><div class="kicker">Hosted by Beag Labs</div><h1 class="disp">Choose your organization name</h1>
<p class="lede">Papyrus goes live at this address. Lowercase letters, numbers and hyphens, 3–40 characters. It can't be changed later.</p>
${notice(message)}<form method="post" action="/deploy/${esc(deployment.id)}/org" data-org-form data-check="/api/org-names/check">
<label for="org">Organization name</label>
<div class="row" style="flex-wrap:nowrap"><input id="org" name="org" required minlength="3" maxlength="40" pattern="[a-z0-9](?:[a-z0-9\\-]*[a-z0-9])?" autocomplete="off" autocapitalize="none" spellcheck="false" placeholder="acme" aria-describedby="org-status"><span class="mono" style="white-space:nowrap;font-size:14px">.${esc(HOSTED_DOMAIN)}</span></div>
<p id="org-status" class="help" aria-live="polite"></p>
${termsCheckbox('terms')}
<p style="margin-top:18px"><button class="btn primary lg full" type="submit">${MICROSOFT}Connect Microsoft and go live</button></p></form></div>
<div class="foot">${byoc ? `<a href="/provision?deployment=${esc(deployment.id)}">Deploy in your own cloud instead</a> · ` : ''}Signed in as ${esc(account.email)} · <a href="/logout">Sign out</a></div>`,
  })

/** Served at COPY_SCRIPT_PATH: buttons with data-copy="<input id>" copy that field. */
export const COPY_SCRIPT_PATH = '/assets/copy.js'

export const COPY_JS = `(function () {
  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var input = document.getElementById(button.getAttribute('data-copy'))
      if (!input) return
      input.select()
      var done = function () { button.textContent = 'Copied' }
      if (navigator.clipboard) navigator.clipboard.writeText(input.value).then(done, function () { document.execCommand('copy'); done() })
      else { document.execCommand('copy'); done() }
    })
  })
})()
`

/** Connect Microsoft stopped at consent: an administrator has to approve Papyrus for the organization. */
export const adminApprovalPage = (approval: AdminApproval, account?: Account | null) =>
  soloLayout({
    title: 'Ask an administrator',
    wide: true,
    account,
    scripts: [COPY_SCRIPT_PATH],
    body: `<div class="body"><div class="kicker">Connect Microsoft</div><h1 class="disp">An administrator needs to approve Papyrus</h1>
<p class="lede">Your Microsoft organization only lets a Global Administrator or Privileged Role Administrator approve new apps. Send them this link. Once they approve, click Try again.</p>
<label for="consent-link">Approval link</label>
<div class="row" style="flex-wrap:nowrap"><input id="consent-link" class="mono" value="${esc(approval.consentUrl)}" readonly style="font-size:12px"><button class="btn" type="button" data-copy="consent-link">Copy</button></div>
${approval.detail ? `<p class="help mono" style="font-size:11.5px;word-break:break-word">Microsoft said: ${esc(approval.detail)}</p>` : ''}
<p style="margin-top:20px"><a class="btn primary lg full" href="/deploy/${esc(approval.deploymentId)}/microsoft/connect">${MICROSOFT}Try again</a></p></div>
<div class="foot"><a href="/deploy/${esc(approval.deploymentId)}">Back to your deployment</a></div>`,
  })

/** Where the shareable approval link lands, for the administrator who approved. */
export const consentedPage = () =>
  soloLayout({
    title: 'Papyrus approved',
    body: `<div class="body"><div class="kicker">Connect Microsoft</div><h1 class="disp">Approved</h1>
<p class="lede" style="margin-bottom:0">Papyrus is approved for your organization. The person setting up Papyrus can now click Connect Microsoft again.</p></div>`,
  })

/** /deploy with no deployment: the plan step. With several: the deployments table (server-rendered, hydrated). */
export const deployListPage = (account: Account, list: ListPayload) => {
  if (list.deployments.length === 0) {
    const body = `${pageTop('Deployment', 'No deployment yet')}<div class="cols"><div class="card" data-plan-step><h4>Choose your plan <span class="accent">${TRIAL_DAYS}-day free trial</span></h4><div class="body">
<p style="font-size:14px;color:var(--muted);margin-bottom:14px">One plan, three charges. Your card is collected now; nothing is charged until the trial ends, and usage during the trial is free.</p>
${pricingTable(PRICE_ROWS, 'Billed monthly by Stripe. Cancel any time from the billing portal.')}
<h5 class="kicker" style="margin:18px 0 8px">What it costs by organization size</h5>
${sizeTable()}
<form method="post" action="/billing/checkout" class="actions" style="margin-top:16px"><button class="btn primary lg" type="submit">Start ${TRIAL_DAYS}-day trial</button></form></div></div><div class="stack">${helpCard(account)}</div></div>`
    return consoleLayout({ title: 'Deployments', account, active: 'deployment', body })
  }
  return consoleLayout({ title: 'Deployments', account, active: 'deployment', body: renderList({ payload: list }), scripts: [DEPLOY_SCRIPT_PATH], styles: DEPLOY_STYLES })
}

// Provision (BYOC) -----------------------------------------------------------------------------------------------------

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
    `<a href="/provision?deployment=${encodeURIComponent(deploymentId)}&provider=${encodeURIComponent(p.id)}"${p.id === selected?.id ? ' aria-current="true"' : ''}><span class="plogo">${p.logo}</span><span><strong>${esc(p.name)}</strong></span></a>`
  return `<details class="dropdown"${selected ? '' : ' open'}><summary>${selected ? `<span class="plogo">${selected.logo}</span>${esc(selected.name)}` : 'Choose where Papyrus runs'}</summary>
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
      ? `<div class="notice" style="margin-top:16px"><p><strong>1.</strong> Create the access role in your AWS account (CloudFormation; you review it before creating).</p>
<p style="margin:10px 0"><a class="btn dark" target="_blank" rel="noopener" href="${esc(quickCreateUrl({ templateUrl: input.awsTemplateUrl, externalId: deployment.aws_external_id, principalArn: input.awsPrincipalArn }))}">${LOGOS.aws}Connect AWS</a></p>
<p class="help">The role trusts only Beag Labs, only with your ExternalId <span class="mono">${esc(deployment.aws_external_id)}</span>, and only for what the deploy needs. <a href="/aws/connect-template.yaml" target="_blank">View template</a>.</p>
<p style="margin-top:10px"><strong>2.</strong> When the stack shows CREATE_COMPLETE, paste its <span class="mono">RoleArn</span> output below. We verify it by assuming the role.</p></div>`
      : ''
  const body = `<p class="kicker" style="margin-bottom:10px"><a href="/deploy/${esc(deployment.id)}">← ${esc(deploymentName(deployment))}</a></p>
${pageTop('Deployment · Your own cloud', 'Provision')}
${input.message ? notice(input.message.text, input.message.kind) : ''}
<div class="cols"><div class="card"><h4>Where Papyrus runs</h4><div class="body">${providerDropdown(deployment.id, provider)}
${
  provider
    ? `<p class="help" style="margin-top:14px">${esc(provider.blurb)}</p>${connectAws}
<form method="post" action="/provision" style="margin-top:16px"><input type="hidden" name="deployment" value="${esc(deployment.id)}"><input type="hidden" name="provider" value="${esc(provider.id)}">
${credentialForm(provider, input.saved)}
<div class="actions" style="margin-top:20px"><button class="btn primary" type="submit">Save and check</button>${deployment.steps.connect.status === 'pass' && deployment.provider === provider.id ? `<a class="btn" href="/deploy/${esc(deployment.id)}">Continue to deploy →</a>` : ''}</div></form>`
    : ''
}</div></div>
<div class="stack"><div class="card"><h4>Your credentials</h4><div class="body" style="font-size:14px;color:var(--muted)">We check them with a read-only call when you save. They are encrypted and used only to deploy and update this Papyrus.</div></div>${helpCard(input.account)}</div></div>`
  return consoleLayout({ title: 'Provision', account: input.account, active: 'deployment', body })
}

// Billing, Team, Support, Settings ------------------------------------------------------------------------------------

export const billingPage = (account: Account, deployments: Deployment[], message?: string | null, usage: Record<string, MonthUsage> = {}) => {
  const cards = deployments.map(
    (d) => `<div class="card"><h4><span class="mono" style="text-transform:none;word-break:break-all">${esc(deploymentName(d))}</span><span class="accent">${planLabel(d)}</span></h4><div class="body">${planRows(d, usage[d.id])}<div class="actions">${billingButton(d)}</div></div></div>`,
  )
  const body = `${pageTop('Billing', 'Plan and invoices')}${notice(message)}
<div class="tiles">${cards.join('')}<div class="card"><h4>Pricing <span class="accent">${TRIAL_DAYS}-day trial</span></h4><div class="body">
${pricingTable()}
<p style="font-size:14px;color:var(--muted);margin-top:12px">One subscription per deployment. Unlimited users. Your card is collected at signup and first charged when the trial ends; usage during the trial is free. Cards and invoices live in the Stripe customer portal.</p>
<form method="post" action="/billing/checkout" class="actions"><button class="btn${deployments.length ? '' : ' primary'}" type="submit">${deployments.length ? 'Add a deployment' : `Start ${TRIAL_DAYS}-day trial`}</button></form></div></div></div>`
  return consoleLayout({ title: 'Billing', account, active: 'billing', body })
}

const day = (iso: string) => {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export const teamPage = (account: Account, members: Account[]) => {
  const body = `${pageTop('Team', accountLabel(account))}
<div class="card"><h4>People <span>${members.length}</span></h4><div style="overflow-x:auto"><table class="list"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Since</th></tr></thead><tbody>${members
    .map((m) => `<tr><td>${esc(m.name ?? '—')}${m.id === account.id ? ' <span class="tag">You</span>' : ''}</td><td class="mono" style="font-size:13px">${esc(m.email)}</td><td>Owner</td><td>${esc(day(m.created_at))}</td></tr>`)
    .join('')}</tbody></table></div></div>
<p class="help" style="margin-top:14px;max-width:640px">People listed here sign in to papyrus.beaglabs.com to manage deployments and billing. People who use Papyrus sign in with Microsoft inside Papyrus itself.</p>`
  return consoleLayout({ title: 'Team', account, active: 'team', body })
}

export const supportPage = (account: Account, deployments: Deployment[]) => {
  const body = `${pageTop('Support', 'Email Beag Labs')}
<div class="tiles">${supportPageCard(account)}
<div class="card"><h4>Your details</h4><div class="body">${
    deployments.length
      ? deployments
          .map((d) => `<div class="kv"><span>${esc(deploymentName(d))}</span><span class="mono" style="font-size:12px">${esc(d.license_deployment_id ?? d.id)}</span></div>`)
          .join('')
      : '<p style="font-size:14px;color:var(--muted)">No deployments yet.</p>'
  }<div class="kv"><span>Account</span><span class="mono" style="font-size:12px">${esc(account.id)}</span></div></div></div></div>`
  return consoleLayout({ title: 'Support', account, active: 'support', body })
}

/** Settings → Delete deployment: irreversible, confirmed by typing the org name (hosted) or hostname (BYOC). */
const deleteCard = (deployment: Deployment) => {
  const name = confirmNameFor(deployment)
  const hosted = !deployment.provider || deployment.provider === HOSTED_PROVIDER
  const id = `confirm-${esc(deployment.id)}`
  return `<div class="card" data-delete-card><h4>Delete deployment <span class="mono" style="text-transform:none">${esc(deploymentName(deployment))}</span></h4><div class="body">
<p style="font-size:14px">${
    hosted
      ? 'Permanently deletes this Papyrus workspace and all of its data, cancels its subscription now (prorated) and revokes its license. The organization name becomes available to others. This cannot be undone.'
      : 'Cancels its subscription now (prorated) and revokes its license, so Papyrus stops working. Nothing is deleted in your cloud account: you get a list of what to remove. This cannot be undone.'
  }</p>
<form method="post" action="/deploy/${esc(deployment.id)}/delete" style="margin-top:12px"><label for="${id}">Type <span class="mono">${esc(name)}</span> to confirm</label>
<input id="${id}" name="confirm" required autocomplete="off" autocapitalize="none" spellcheck="false" data-confirm="${esc(name)}">
<div class="actions" style="margin-top:14px"><button class="btn danger" type="submit">Delete deployment</button></div></form></div></div>`
}

export const settingsPage = (account: Account, deployments: Deployment[], message?: { text: string; kind: 'error' | 'ok' } | null) => {
  // The organization goes on the license when a deployment registers, so it is fixed from then on.
  const locked = deployments.some((d) => d.license_deployment_id)
  const body = `${pageTop('Settings', 'Settings')}${message ? notice(message.text, message.kind) : ''}
<div class="tiles"><div class="card"><h4>Account</h4><div class="body"><form method="post" action="/settings">
<label for="name">Your name</label><input id="name" name="name" value="${esc(account.name ?? '')}" autocomplete="name" maxlength="200">
<label for="organization">Organization</label><input id="organization" name="organization" value="${esc(account.organization ?? '')}" autocomplete="organization" maxlength="200"${locked ? ' readonly aria-describedby="org-locked"' : ''}>
${locked ? '<p class="help" id="org-locked">Fixed once deployed: it is on your Papyrus license.</p>' : ''}
<label for="email">Email</label><input id="email" value="${esc(account.email)}" readonly>
<div class="actions" style="margin-top:18px"><button class="btn primary" type="submit">Save</button></div></form></div></div>
<div class="card"><h4>Addresses</h4><div class="body">${
    deployments.length
      ? deployments
          .map((d) =>
            d.hostname
              ? `<label for="host-${esc(d.id)}">${esc(providerName(d))}</label><input id="host-${esc(d.id)}" class="mono" value="${esc(d.hostname)}" readonly>`
              : `<p style="font-size:14px">No address yet. <a href="/deploy/${esc(d.id)}">Choose your organization name</a>.</p>`,
          )
          .join('') + '<p class="help">Addresses are fixed once claimed.</p>'
      : '<p style="font-size:14px;color:var(--muted)">No deployments yet.</p>'
  }</div></div>${deployments.filter((d) => d.lifecycle !== 'deleting').map(deleteCard).join('')}</div>`
  return consoleLayout({ title: 'Settings', account, active: 'settings', body })
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
