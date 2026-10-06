"use client"

import { useEffect, useState } from 'react'
import { FileKey2, Download } from 'lucide-react'
import { toast } from 'sonner'
import { licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Issuance = { issuanceId: string; document: Record<string, unknown> }
type Scope = { scope: 'deployment' | 'organization'; organizationId: string; organizationName: string; entitlementId: string; expiresAt: string | null; allowedTenantIds?: string[]; allowedDomains?: string[] }
const entries = (value: string) => [...new Set(value.split(/[\s,]+/).map(item => item.trim().toLowerCase()).filter(Boolean))]
const formFor = (value: Scope) => ({ scope: value.scope, tenants: value.allowedTenantIds?.join('\n') ?? '', domains: value.allowedDomains?.join('\n') ?? '' })

export function OrganizationLicensePanel({ entitlements, onIssued }: { entitlements: Row[]; onIssued: (issuance: Issuance) => void }) {
  const [entitlementId, setEntitlementId] = useState('')
  const [approved, setApproved] = useState<Scope | null>(null)
  const [form, setForm] = useState({ scope: 'deployment' as Scope['scope'], tenants: '', domains: '' })
  const [history, setHistory] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    setApproved(null); setHistory([]); setError('')
    if (!entitlementId) return
    const controller = new AbortController()
    setBusy(true)
    void Promise.all([
      licenseFetch<Scope>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/license-scope`, { signal: controller.signal }),
      licenseFetch<{ items: Row[] }>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/licenses`, { signal: controller.signal }),
    ]).then(([scope, issuances]) => { if (!controller.signal.aborted) { setApproved(scope); setForm(formFor(scope)); setHistory(issuances.items) } })
      .catch(cause => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load license scope.') })
      .finally(() => { if (!controller.signal.aborted) setBusy(false) })
    return () => controller.abort()
  }, [entitlementId])
  const dirty = !approved || JSON.stringify(form) !== JSON.stringify(formFor(approved))
  const save = async () => {
    setBusy(true); setError('')
    try {
      await licenseFetch(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/license-scope`, { method: 'PUT', body: JSON.stringify(form.scope === 'deployment' ? { scope: form.scope } : { scope: form.scope, allowedTenantIds: entries(form.tenants), ...(entries(form.domains).length ? { allowedDomains: entries(form.domains) } : {}) }) })
      const scope = await licenseFetch<Scope>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/license-scope`)
      setApproved(scope); setForm(formFor(scope)); toast.success('License scope saved. Generate a new license to apply it.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save scope.') }
    finally { setBusy(false) }
  }
  const issue = async () => {
    setBusy(true); setError('')
    try {
      const result = await licenseFetch<Issuance>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/licenses`, { method: 'POST', body: '{}' })
      const issuances = await licenseFetch<{ items: Row[] }>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/licenses`)
      setHistory(issuances.items); onIssued(result); toast.success('Organization license signed. Download the JSON document below.')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to issue license.') }
    finally { setBusy(false) }
  }
  return <section className="nb-panel p-6 lg:p-8 xl:col-span-2">
    <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#666]">Organization licensing</p>
    <h2 className="mt-2 text-[27px] font-extrabold tracking-[-0.035em]">License the organization, not every VM.</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-[#666]">For the normal enterprise motion, issue one offline organization license for unlimited customer-hosted Papyrus VMs within approved Entra tenants. Add exact hostnames only when the agreement requires them. The entitlement controls features, profiles, and expiry.</p>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <label className="block text-sm font-bold">Entitlement
          <select className="nb-input mt-2 w-full" value={entitlementId} disabled={busy} onChange={event => setEntitlementId(event.target.value)}>
            <option value="">Select entitlement…</option>
            {entitlements.map(row => <option key={String(row.id)} value={String(row.id)}>{String(row.customer_name ?? row.customer_organization_id ?? '')} — {String(row.id)}</option>)}
          </select>
        </label>
        {approved && <>
          <div className="border-2 border-[#111] bg-[#FAFAF9] p-4 text-sm"><strong>{approved.organizationName}</strong><p className="mt-1">Expires {approved.expiresAt ? new Date(approved.expiresAt).toLocaleDateString() : 'not set — a finite term is required for organization licensing'}</p></div>
          <label className="block text-sm font-bold">License scope
            <select className="nb-input mt-2 w-full" disabled={busy} value={form.scope} onChange={event => setForm({ ...form, scope: event.target.value as Scope['scope'] })}>
              <option value="deployment">Single deployment</option><option value="organization">Organization · unlimited VMs</option>
            </select>
          </label>
          {form.scope === 'organization' && <>
            <label className="block text-sm font-bold">Approved Entra tenant IDs
              <textarea className="nb-input mt-2 min-h-24 w-full font-mono text-xs" disabled={busy} value={form.tenants} placeholder="One directory UUID per line" onChange={event => setForm({ ...form, tenants: event.target.value })} />
            </label>
            <label className="block text-sm font-bold">Allowed hostnames · optional
              <textarea className="nb-input mt-2 min-h-20 w-full font-mono text-xs" disabled={busy} value={form.domains} placeholder="papyrus.customer.com — exact names, no URLs or wildcards" onChange={event => setForm({ ...form, domains: event.target.value })} />
            </label>
          </>}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={busy || !dirty || (form.scope === 'organization' && !entries(form.tenants).length)} onClick={() => void save()} className="nb-btn px-4 py-3 text-xs font-black uppercase disabled:opacity-50">Save approved scope</button>
            <button type="button" disabled={busy || dirty || approved.scope !== 'organization'} onClick={() => void issue()} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-3 text-xs font-black uppercase disabled:opacity-50"><FileKey2 className="h-4 w-4" />Generate license</button>
          </div>
          {dirty && <p className="text-xs text-[#666]">Save scope changes before generating.</p>}
          {approved.scope === 'deployment' && !dirty && <p className="text-xs text-[#666]">Issue single-deployment licenses from the Deployments tab.</p>}
        </>}
        {error && <p role="alert" className="border-2 border-[#111] bg-[#fff1e9] p-3 text-sm">{error}</p>}
      </div>
      <div>
        <h3 className="text-lg font-extrabold">Organization issuance history</h3>
        <p className="mt-2 text-xs leading-5 text-[#666]">Scope changes apply when a new document is issued. Existing offline licenses remain valid until their signed expiry; reissue and distribute replacements for renewals.</p>
        {history.length ? <ul className="mt-5 space-y-3">{history.map(row => <li key={String(row.id)} className="border-2 border-[#111] p-4">
          <p className="break-all font-mono text-xs font-bold">{String(row.license_id)}</p>
          <p className="mt-2 text-xs">{String(row.status)} · Expires {new Date(String(row.expires_at)).toLocaleDateString()}</p>
          <button type="button" disabled={busy} className="mt-3 inline-flex items-center gap-2 text-xs font-bold" onClick={() => { try { onIssued({ issuanceId: String(row.id), document: JSON.parse(String(row.signed_document_json)) }) } catch { setError('This stored document could not be opened.') } }}><Download className="h-4 w-4" />View and download</button>
        </li>)}</ul> : <p className="mt-5 border-2 border-dashed border-[#ccc] p-4 text-sm text-[#666]">{busy ? 'Loading…' : 'No organization licenses issued for this entitlement.'}</p>}
      </div>
    </div>
  </section>
}
