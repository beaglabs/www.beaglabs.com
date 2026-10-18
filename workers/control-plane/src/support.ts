/**
 * Email support (replaced the Beag Labs chat bubble on 2026-10-17). A small fixed card bottom-right on every signed-in
 * page, and a larger card on /support. The photo is a Workers static asset (public/assets); the collapse toggle is a
 * same-origin script because the CSP allows no inline scripts.
 */
import type { Account } from './services'

export const SUPPORT_EMAIL = 'james@beaglabs.com'
export const SUPPORT_COPY = 'Stuck? Email James and get support within 48 hours'
/** public/assets/james-support-96.jpg: 96px, served by Workers static assets. */
export const SUPPORT_PHOTO_PATH = '/assets/james-support-96.jpg'
export const SUPPORT_SCRIPT_PATH = '/assets/support-card.js'
const STORAGE_KEY = 'papyrus.supportCard'

const esc = (value: unknown) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

/** mailto with the deployment hostname(s) and the account in the body, so James knows who is writing. */
export const supportMailto = (account: Pick<Account, 'id' | 'email' | 'hostnames'>) => {
  const hosts = (account.hostnames ?? []).filter(Boolean)
  const body = [
    '',
    '',
    '---',
    `Deployment: ${hosts.length ? hosts.join(', ') : 'none yet'}`,
    `Account: ${account.email} (${account.id})`,
  ].join('\n')
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Papyrus support')}&body=${encodeURIComponent(body)}`
}

const photo = (size: number) =>
  `<img src="${SUPPORT_PHOTO_PATH}" width="${size}" height="${size}" alt="James, Beag Labs" loading="lazy" decoding="async">`

/** The fixed bottom-right card. Collapsed state comes from the script (localStorage), else CSS: open on desktop, a tab on phones. */
export const supportCardMarkup = (account: Pick<Account, 'id' | 'email' | 'hostnames'>) =>
  `<aside class="support-card" id="support-card" aria-label="Support">
<div class="support-full"><a class="support-link" href="${esc(supportMailto(account))}">${photo(48)}<span>${esc(SUPPORT_COPY)}</span></a><button type="button" class="support-toggle" data-support-collapse aria-label="Hide support card" aria-controls="support-card">&times;</button></div>
<button type="button" class="support-tab" data-support-expand aria-label="Show support card" aria-controls="support-card">${photo(24)}<span>Support</span></button>
</aside><script src="${SUPPORT_SCRIPT_PATH}" defer></script>`

/** The /support page card: same photo and copy, larger, with the address spelled out. */
export const supportPageCard = (account: Pick<Account, 'id' | 'email' | 'hostnames'>) =>
  `<div class="card support-page-card"><h4>Email support</h4><div class="body"><div class="support-page-row">${photo(96)}<div><p class="support-page-copy">${esc(SUPPORT_COPY)}</p>
<p class="actions"><a class="btn primary" href="${esc(supportMailto(account))}">Email ${esc(SUPPORT_EMAIL)}</a></p></div></div></div></div>`

export const SUPPORT_STYLES = `
.support-card{position:fixed;right:20px;bottom:20px;z-index:90;font-family:var(--sans);color:#111}
.support-full{display:flex;align-items:stretch;width:300px;max-width:calc(100vw - 32px);border:2px solid #111;background:#fff;box-shadow:4px 4px 0 #111}
.support-link{flex:1;display:flex;align-items:center;gap:12px;padding:10px 12px;color:#111;text-decoration:none;font:800 14px/1.3 var(--sans);border-left:6px solid #ff5f1f}
.support-link:hover span{text-decoration:underline}
.support-link img,.support-tab img{flex:none;display:block;border:2px solid #111;object-fit:cover}
.support-toggle{flex:none;width:30px;border:0;border-left:2px solid #111;background:#fff;font:900 18px/1 var(--sans);cursor:pointer;color:#111}
.support-toggle:hover{background:#ff5f1f}
.support-tab{display:none;align-items:center;gap:8px;padding:4px 10px 4px 4px;border:2px solid #111;background:#ff5f1f;box-shadow:3px 3px 0 #111;font:800 13px/1 var(--sans);color:#111;cursor:pointer}
.support-link:focus-visible,.support-toggle:focus-visible,.support-tab:focus-visible{outline:3px solid #111;outline-offset:2px}
.support-card[data-collapsed="true"] .support-full{display:none}
.support-card[data-collapsed="true"] .support-tab{display:inline-flex}
@media (max-width:640px){
.support-card{right:16px;bottom:16px}
.support-card:not([data-collapsed="false"]) .support-full{display:none}
.support-card:not([data-collapsed="false"]) .support-tab{display:inline-flex}
}
.support-page-row{display:flex;align-items:center;gap:18px;flex-wrap:wrap}
.support-page-row img{flex:none;display:block;border:2px solid #111;box-shadow:4px 4px 0 #111}
.support-page-copy{margin:0;font:800 18px/1.35 var(--sans)}
`

/** Served at SUPPORT_SCRIPT_PATH. Remembers collapsed/expanded per browser; storage may be unavailable, so every access is guarded. */
export const SUPPORT_JS = `(() => {
  const card = document.getElementById('support-card')
  if (!card) return
  const KEY = ${JSON.stringify(STORAGE_KEY)}
  const read = () => { try { return window.localStorage.getItem(KEY) } catch { return null } }
  const write = (value) => { try { window.localStorage.setItem(KEY, value) } catch {} }
  const stored = read()
  if (stored === 'collapsed') card.dataset.collapsed = 'true'
  else if (stored === 'expanded') card.dataset.collapsed = 'false'
  const set = (collapsed) => {
    card.dataset.collapsed = collapsed ? 'true' : 'false'
    write(collapsed ? 'collapsed' : 'expanded')
    const focus = card.querySelector(collapsed ? '[data-support-expand]' : '[data-support-collapse]')
    if (focus) focus.focus()
  }
  card.querySelector('[data-support-collapse]')?.addEventListener('click', () => set(true))
  card.querySelector('[data-support-expand]')?.addEventListener('click', () => set(false))
})()
`
