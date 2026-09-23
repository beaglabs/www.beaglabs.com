import { Hono } from 'hono'
import { buildAuth } from './auth'
import { first, getDb } from './db'
import type { Bindings } from './env'
import { escapeHtml, page } from './ui'

type Row = Record<string, unknown>
const app = new Hono<{ Bindings: Bindings }>()

async function hasPartnerAccess(request: Request, env: Bindings): Promise<boolean> {
  const session = await buildAuth(env).api.getSession({ headers: request.headers })
  if (!session?.user?.id) return false
  const row = first<Row>(await getDb(env).execute({
    sql: `SELECT 1 AS allowed
          FROM partner_users pu
          JOIN partners p ON p.id=pu.partner_id
          WHERE pu.auth_user_id=? AND pu.status='active' AND p.partner_status='active'
          LIMIT 1`,
    args: [session.user.id],
  }))
  return Boolean(row)
}

app.get('/partner/login', (c) => {
  const oauthFlow = new URL(c.req.url).search.length > 1
  const context = oauthFlow
    ? '<div class="notice">You are signing in to authorize a Beag Labs OAuth client. The authorization request is cryptographically signed and will continue after authentication.</div>'
    : ''

  return c.html(page('Partner sign in', `<div class="hero"><div><span class="eyebrow">Partner portal</span><h1>Sign in without a password.</h1><p class="lede">Enter an email already associated with an approved Beag Labs partner. We will send a single-use sign-in link.</p>${context}<form id="signin" class="card" style="max-width:600px"><div class="field"><label>Partner email</label><input class="input" type="email" name="email" required autocomplete="email"></div><button class="btn orange">Send sign-in link</button><div id="message"></div></form></div><div class="card"><h3>Not a partner yet?</h3><p>New companies must complete legal-entity onboarding and be approved before sign-in links are issued.</p><a class="btn" href="/partners/apply">Apply to partner</a></div></div>`, 'public', `
document.getElementById('signin').onsubmit=async(e)=>{e.preventDefault();const email=new FormData(e.currentTarget).get('email');const m=document.getElementById('message');m.innerHTML='<div class="notice">Sending…</div>';const signedQuery=window.location.search.length>1?window.location.search.slice(1):'';const body={email,callbackURL:'/portal',errorCallbackURL:'/partner/login?error=signin'};if(signedQuery)body.oauth_query=signedQuery;const r=await fetch('/api/auth/sign-in/magic-link',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});m.innerHTML=r.ok?'<div class="notice ok">If that address is authorized, a sign-in link has been sent.</div>':'<div class="notice error">This email is not authorized for partner access.</div>'};`))
})

app.get('/oauth/consent', async (c) => {
  if (!(await hasPartnerAccess(c.req.raw, c.env))) {
    const signedQuery = new URL(c.req.url).search
    return c.redirect(`/partner/login${signedQuery}`)
  }

  const url = new URL(c.req.url)
  const clientId = url.searchParams.get('client_id') ?? 'unknown-client'
  const scope = url.searchParams.get('scope') ?? 'openid profile email'
  const claims = url.searchParams.get('claims')
  const scopes = scope.split(/\s+/).filter(Boolean)

  return c.html(page('Authorize application', `<div class="hero"><div><span class="eyebrow">Beag Labs OAuth</span><h1>Authorize application access.</h1><p class="lede">Client <span class="mono">${escapeHtml(clientId)}</span> is requesting access to your approved Beag Labs partner identity.</p><div class="notice">Only grant access if you recognize the application and expected this authorization request.</div></div><div class="card soft"><h3>Requested scopes</h3>${scopes.map((item) => `<div class="check"><strong class="mono">${escapeHtml(item)}</strong></div>`).join('')}</div></div><div class="actions"><button id="allow" class="btn orange">Allow</button><button id="deny" class="btn danger">Deny</button></div><div id="message"></div>`, 'partner', `
async function consent(accept){const m=document.getElementById('message');m.innerHTML='<div class="notice">Recording decision…</div>';const oauth_query=window.location.search.slice(1);const body={accept,scope:${JSON.stringify(scope)},oauth_query};${claims ? `body.claims=${JSON.stringify(claims)};` : ''}const r=await fetch('/api/auth/oauth2/consent',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),redirect:'follow'});let b={};try{b=await r.clone().json()}catch{}if(r.redirected){location.assign(r.url);return}const target=b.url||b.redirectURI||b.redirectUri;if(target){location.assign(target);return}if(!r.ok){m.innerHTML='<div class="notice error">'+(b.message||b.error||'Unable to record consent.')+'</div>';return}m.innerHTML='<div class="notice ok">Authorization recorded.</div>'}document.getElementById('allow').onclick=()=>consent(true);document.getElementById('deny').onclick=()=>consent(false);`))
})

export default app
