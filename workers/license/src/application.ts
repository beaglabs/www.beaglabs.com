import { Hono } from 'hono'
import { getDb, rows } from './db'
import type { Bindings } from './env'
import { escapeHtml, page } from './ui'

type Row = Record<string, unknown>

function money(cents: unknown): string {
  if (cents === null || cents === undefined) return 'Contact Beag'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(cents) / 100)
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/partners/apply', async (c) => {
  const products = rows<Row>(await getDb(c.env).execute(`SELECT sku,name,list_price_cents FROM products WHERE active=1 ORDER BY sku`))
  const options = products.map((product) => `<option value="${escapeHtml(product.sku)}">${escapeHtml(product.sku)} — ${escapeHtml(product.name)} — ${escapeHtml(money(product.list_price_cents))}</option>`).join('')

  const body = `<div class="hero"><div><span class="eyebrow">Partner network</span><h1>Work with Beag Labs.</h1><p class="lede">Apply for access to the Beag Labs Partner Portal. Applications are manually reviewed before any account is created. UEI and CAGE are required so federal channel activity stays tied to the correct legal entity.</p></div><div class="card orange"><h3>Approved access</h3><p>Partners can view Papyrus SKUs, submit commercial order requests, track review status, and follow provisioning instructions. Entitlements and signed licenses remain Beag-controlled.</p></div></div>
  <div class="grid"><section class="card span-8"><h2>Partner onboarding</h2><p class="muted">All fields are required. Hold Ctrl/Cmd to select more than one SKU.</p><form id="application">
    <div class="form-grid"><div class="field"><label>Company name</label><input class="input" name="companyName" required maxlength="256"></div><div class="field"><label>Company domain</label><input class="input" name="companyDomain" required placeholder="example.com" inputmode="url"></div></div>
    <div class="form-grid"><div class="field"><label>UEI</label><input class="input mono" name="uei" required minlength="12" maxlength="12" pattern="[A-Za-z0-9]{12}" placeholder="12-character UEI"></div><div class="field"><label>CAGE</label><input class="input mono" name="cage" required minlength="5" maxlength="5" pattern="[A-Za-z0-9]{5}" placeholder="5-character CAGE"></div></div>
    <div class="form-grid"><div class="field"><label>Annual revenue (USD)</label><input class="input" type="number" name="annualRevenueUsd" required min="0" step="1" placeholder="25000000"></div><div class="field"><label>Partner type</label><select name="partnerType" required><option value="">Select…</option><option value="distributor">Distributor</option><option value="reseller">Reseller</option><option value="prime">Prime contractor</option><option value="systems_integrator">Systems integrator</option><option value="referral">Referral partner</option><option value="technology">Technology partner</option></select></div></div>
    <div class="form-grid"><div class="field"><label>Main POC name</label><input class="input" name="pocName" required maxlength="200"></div><div class="field"><label>Main POC email</label><input class="input" type="email" name="pocEmail" required></div></div>
    <div class="field"><label>SKUs of interest</label><select name="skuInterests" multiple required size="4" aria-describedby="sku-help">${options}</select><div id="sku-help" class="small muted" style="margin-top:7px">Select one or more current Papyrus SKUs.</div></div>
    <input class="hide" tabindex="-1" autocomplete="off" name="website" aria-hidden="true"><div class="actions"><button class="btn orange" type="submit">Submit for review</button><span class="small muted">No account or contractual commitment is created until Beag approves.</span></div><div id="message"></div>
  </form></section><aside class="card span-4"><h3>Review process</h3><div class="steps"><div class="step"><div><h4>Submit</h4><p>We capture your legal entity, federal identifiers, POC, revenue, partner type, and SKU interest.</p></div></div><div class="step"><div><h4>Beag confirms</h4><p>Partner Operations receives a protected approve/reject email. Opening the email alone cannot approve the application.</p></div></div><div class="step"><div><h4>Register</h4><p>The approved POC receives a single-use invitation for passwordless Beag Labs OAuth identity registration.</p></div></div></div></aside></div>`

  const script = `const form=document.getElementById('application');form.addEventListener('submit',async(e)=>{e.preventDefault();const fd=new FormData(form);const body={companyName:fd.get('companyName'),companyDomain:fd.get('companyDomain'),annualRevenueUsd:Number(fd.get('annualRevenueUsd')),uei:fd.get('uei'),cage:fd.get('cage'),partnerType:fd.get('partnerType'),pocName:fd.get('pocName'),pocEmail:fd.get('pocEmail'),skuInterests:fd.getAll('skuInterests'),website:fd.get('website')};const m=document.getElementById('message');m.textContent='Submitting…';const r=await fetch('/api/partner/applications',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const b=await r.json().catch(()=>({}));m.className='notice '+(r.ok?'ok':'error');m.textContent=r.ok?'Application submitted. Partner Operations has been notified for review.':(b.message||b.error||'Unable to submit application.');if(r.ok)form.reset()});`
  return c.html(page('Partner application', body, 'public', script))
})

export default app
