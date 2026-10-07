"use client"

import { Download, FileKey2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { CrmCombobox } from './crm-combobox'
import { licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Issuance = { issuanceId: string; document: Record<string, unknown> }
type Scope = {
  scope: 'deployment' | 'organization'
  organizationId: string
  organizationName: string
  entitlementId: string
  expiresAt: string | null
  allowedTenantIds?: string[]
  allowedDomains?: string[]
}

const entries = (value: string) => [...new Set(value.split(/[\s,]+/).map(item => item.trim().toLowerCase()).filter(Boolean))]
const formFor = (value: Scope) => ({
  scope: value.scope,
  tenants: value.allowedTenantIds?.join('\n') ?? '',
  domains: value.allowedDomains?.join('\n') ?? '',
})

export function OrganizationLicensePanel({
  entitlements,
  onIssued,
}: {
  entitlements: Row[]
  onIssued: (issuance: Issuance) => void
}) {
  const [entitlementId, setEntitlementId] = useState('')
  const [approved, setApproved] = useState<Scope | null>(null)
  const [form, setForm] = useState({ scope: 'deployment' as Scope['scope'], tenants: '', domains: '' })
  const [history, setHistory] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setApproved(null)
    setHistory([])
    setError('')
    if (!entitlementId) return

    const controller = new AbortController()
    setBusy(true)
    void Promise.all([
      licenseFetch<Scope>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/license-scope`, { signal: controller.signal }),
      licenseFetch<{ items: Row[] }>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/licenses`, { signal: controller.signal }),
    ]).then(([scope, issuances]) => {
      if (!controller.signal.aborted) {
        setApproved(scope)
        setForm(formFor(scope))
        setHistory(issuances.items)
      }
    }).catch(cause => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Unable to load license scope.')
    }).finally(() => {
      if (!controller.signal.aborted) setBusy(false)
    })

    return () => controller.abort()
  }, [entitlementId])

  const dirty = !approved || JSON.stringify(form) !== JSON.stringify(formFor(approved))

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await licenseFetch(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/license-scope`, {
        method: 'PUT',
        body: JSON.stringify(form.scope === 'deployment'
          ? { scope: form.scope }
          : {
              scope: form.scope,
              allowedTenantIds: entries(form.tenants),
              ...(entries(form.domains).length ? { allowedDomains: entries(form.domains) } : {}),
            }),
      })
      const scope = await licenseFetch<Scope>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/license-scope`)
      setApproved(scope)
      setForm(formFor(scope))
      toast.success('License scope saved. Generate a new license to apply it.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to save scope.')
    } finally {
      setBusy(false)
    }
  }

  const issue = async () => {
    setBusy(true)
    setError('')
    try {
      const result = await licenseFetch<Issuance>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/licenses`, {
        method: 'POST',
        body: '{}',
      })
      const issuances = await licenseFetch<{ items: Row[] }>(`/api/v1/entitlements/${encodeURIComponent(entitlementId)}/licenses`)
      setHistory(issuances.items)
      onIssued(result)
      toast.success('Organization license signed.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to issue license.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="nb-panel mx-auto w-full max-w-[1040px] p-6 lg:p-8">
      <div className="mx-auto max-w-[680px] text-center">
        <p className="font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#ff5f1f]">Organization licensing</p>
        <h2 className="mt-2 text-[28px] font-extrabold tracking-[-0.04em]">License the organization, not every VM.</h2>
        <p className="mt-3 text-[13px] leading-6 text-[#666]">
          Select a provisioned entitlement, approve its Entra tenant scope, then generate the signed offline license used by customer-hosted Papyrus deployments.
        </p>
      </div>

      <div className="mx-auto mt-7 max-w-[680px]">
        <div className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#555]">Entitlement</div>
        <CrmCombobox
          className="mt-2"
          value={entitlementId}
          disabled={busy}
          onValueChange={setEntitlementId}
          options={entitlements.map(row => ({
            value: String(row.id),
            label: [String(row.customer_name ?? row.customer_organization_id ?? ''), String(row.sku ?? '')].filter(Boolean).join(' — ') || String(row.id),
            keywords: [String(row.id)],
          }))}
          placeholder={entitlements.length ? 'Select entitlement…' : 'No entitlements provisioned'}
          searchPlaceholder="Search entitlements…"
        />
        <p className="mt-2 text-center text-[11px] text-[#777]">
          {entitlements.length ? `${entitlements.length} entitlement${entitlements.length === 1 ? '' : 's'} available` : 'Provision an entitlement from the Entitlements tab first.'}
        </p>
      </div>

      {!entitlementId ? (
        <div className="mx-auto mt-8 max-w-[680px] border-[3px] border-dashed border-[#bbb] bg-[#FAFAF9] px-6 py-10 text-center">
          <FileKey2 className="mx-auto h-7 w-7" />
          <div className="mt-3 text-[16px] font-extrabold">Choose an entitlement to configure issuance</div>
          <p className="mx-auto mt-2 max-w-lg text-[12px] leading-5 text-[#777]">Scope settings and issuance history stay hidden until an entitlement is selected.</p>
        </div>
      ) : null}

      {approved ? (
        <div className="mt-8 grid gap-7 border-t-[3px] border-[#111] pt-7 lg:grid-cols-[1.05fr_.95fr]">
          <div className="space-y-5">
            <div className="border-2 border-[#111] bg-[#FAFAF9] p-4 text-sm">
              <strong>{approved.organizationName}</strong>
              <p className="mt-1 text-[12px] text-[#666]">
                Expires {approved.expiresAt ? new Date(approved.expiresAt).toLocaleDateString() : 'not set — a finite term is required for organization licensing'}
              </p>
            </div>

            <div>
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#555]">License scope</div>
              <CrmCombobox
                className="mt-2"
                disabled={busy}
                value={form.scope}
                onValueChange={value => setForm({ ...form, scope: value as Scope['scope'] })}
                options={[
                  { value: 'organization', label: 'Organization · unlimited VMs' },
                  { value: 'deployment', label: 'Single deployment' },
                ]}
              />
            </div>

            {form.scope === 'organization' ? (
              <>
                <label className="block text-sm font-bold">
                  Approved Entra tenant IDs
                  <textarea
                    className="nb-input mt-2 min-h-24 w-full font-mono text-xs"
                    disabled={busy}
                    value={form.tenants}
                    placeholder="One directory UUID per line"
                    onChange={event => setForm({ ...form, tenants: event.target.value })}
                  />
                </label>
                <label className="block text-sm font-bold">
                  Allowed hostnames · optional
                  <textarea
                    className="nb-input mt-2 min-h-20 w-full font-mono text-xs"
                    disabled={busy}
                    value={form.domains}
                    placeholder="papyrus.customer.com — exact names, no URLs or wildcards"
                    onChange={event => setForm({ ...form, domains: event.target.value })}
                  />
                </label>
              </>
            ) : (
              <div className="border-2 border-[#111] bg-[#fff0a6] p-4 text-[12px] leading-5">
                Deployment-bound licensing is an exception path. Switch to organization scope to generate an organization license here.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={busy || !dirty || (form.scope === 'organization' && !entries(form.tenants).length)}
                onClick={() => void save()}
                className="nb-btn px-4 py-3 text-xs font-black uppercase disabled:opacity-50"
              >
                Save approved scope
              </button>
              <button
                type="button"
                disabled={busy || dirty || approved.scope !== 'organization'}
                onClick={() => void issue()}
                className="nb-btn-orange inline-flex items-center gap-2 px-4 py-3 text-xs font-black uppercase disabled:opacity-50"
              >
                <FileKey2 className="h-4 w-4" />
                Generate license
              </button>
            </div>

            {dirty ? <p className="text-xs text-[#666]">Save scope changes before generating.</p> : null}
            {error ? <p role="alert" className="border-2 border-[#111] bg-[#fff1e9] p-3 text-sm">{error}</p> : null}
          </div>

          <div>
            <h3 className="text-[18px] font-extrabold">Issuance history</h3>
            <p className="mt-2 text-[12px] leading-5 text-[#666]">Each generated document remains valid until its signed expiry. Reissue after scope or term changes.</p>
            {history.length ? (
              <ul className="mt-5 space-y-3">
                {history.map(row => (
                  <li key={String(row.id)} className="border-2 border-[#111] bg-[#FAFAF9] p-4">
                    <p className="break-all font-mono text-xs font-bold">{String(row.license_id)}</p>
                    <p className="mt-2 text-xs">{String(row.status)} · Expires {new Date(String(row.expires_at)).toLocaleDateString()}</p>
                    <button
                      type="button"
                      disabled={busy}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-bold"
                      onClick={() => {
                        try {
                          onIssued({ issuanceId: String(row.id), document: JSON.parse(String(row.signed_document_json)) })
                        } catch {
                          setError('This stored document could not be opened.')
                        }
                      }}
                    >
                      <Download className="h-4 w-4" />
                      View signed document
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-5 border-2 border-dashed border-[#bbb] bg-[#FAFAF9] p-5 text-center text-[12px] text-[#777]">
                {busy ? 'Loading…' : 'No licenses issued for this entitlement yet.'}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {entitlementId && !approved && !busy && error ? (
        <p role="alert" className="mx-auto mt-6 max-w-[680px] border-2 border-[#111] bg-[#fff1e9] p-3 text-sm">{error}</p>
      ) : null}
    </section>
  )
}
