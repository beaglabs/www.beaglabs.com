'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, LogIn, LogOut, RefreshCw } from 'lucide-react'
import { licenseFetch, LicenseControlPlaneError, licensingCallbackUrl } from '@/lib/license-control-plane'

type Admin = { oid: string; tenantId: string; email?: string }
type Account = {
  organization_id: string; organization_display_name?: string; legal_name?: string;
  domain?: string; primary_domain?: string; display_name?: string; email?: string;
  environment?: string; tenant_id?: string; source?: string;
  logo_url?: string | null; marketplace_trial_status?: string | null;
  marketplace_trial_days_remaining?: number | null; marketplace_trial_ends_at?: string | null;
  deployment_count?: number; last_seen_at?: string; marketplace_plan?: string;
}

const formatDate = (value?: string | null) => {
  if (!value) return '—'
  const time = Date.parse(value)
  return Number.isFinite(time) ? new Date(time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
}

export function CrmTable() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState('')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await licenseFetch<{ items: Account[] }>('/api/v1/provisioned-accounts')
      setAccounts(result.items || [])
      setError('')
    } catch (err) {
      if (err instanceof LicenseControlPlaneError && err.status === 401) {
        setAdmin(null)
        setAccounts([])
      } else setError(err instanceof Error ? err.message : 'Unable to retrieve CRM accounts.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    let active = true
    void licenseFetch<{ admin: Admin }>('/api/v1/me')
      .then(({ admin }) => { if (active) setAdmin(admin) })
      .catch((err) => {
        if (!active) return
        if (!(err instanceof LicenseControlPlaneError && err.status === 401))
          setError(err instanceof Error ? err.message : 'Unable to verify administrator access.')
      })
      .finally(() => { if (active) setChecking(false) })
    return () => { active = false }
  }, [])

  useEffect(() => { if (admin) void load() }, [admin, load])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return accounts.filter((row) => !term || [
      row.organization_display_name, row.legal_name, row.domain, row.primary_domain,
      row.display_name, row.email, row.environment, row.tenant_id,
    ].some((value) => value?.toLowerCase().includes(term)))
  }, [accounts, query])

  const signIn = async () => {
    setSigningIn(true)
    setError('')
    try {
      const result = await licenseFetch<{ url?: string }>('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'microsoft',
          callbackURL: licensingCallbackUrl('/crm'),
          errorCallbackURL: licensingCallbackUrl('/crm?auth=error'),
        }),
      })
      if (!result.url) throw new Error('Microsoft sign-in did not return a URL.')
      window.location.assign(result.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microsoft sign-in failed.')
      setSigningIn(false)
    }
  }

  const signOut = async () => {
    try { await licenseFetch('/api/auth/sign-out', { method: 'POST', body: '{}' }) } catch {}
    setAdmin(null)
    setAccounts([])
  }

  if (checking) return <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
  if (!admin) return (
    <div className="mx-auto mt-14 max-w-lg border-2 border-black bg-white p-8">
      <h2 className="text-xl font-bold">Private CRM</h2>
      <p className="mt-3 text-sm text-neutral-600">Authorized Beag Labs Microsoft Entra administrators only.</p>
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <button onClick={() => void signIn()} disabled={signingIn} className="mt-6 inline-flex items-center gap-2 border-2 border-black bg-[#ff5f1f] px-4 py-2 text-sm font-bold disabled:opacity-50">
        {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Sign in with Microsoft
      </button>
    </div>
  )

  return <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="text-sm text-neutral-600">{accounts.length} accounts · {accounts.filter((a) => a.marketplace_trial_status === 'active').length} active trials</div>
      <div className="flex gap-2">
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        <button onClick={() => void signOut()} className="inline-flex items-center gap-2 border border-neutral-300 bg-white px-3 py-2 text-xs font-semibold"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </div>
    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search organizations, people, domains…" aria-label="Search CRM" className="w-full max-w-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-offset-2" />
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="w-full min-w-[890px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
          <tr>{['Organization', 'Contact', 'Source', 'Trial status', 'Trial ends', 'Deployments', 'Last seen'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {filtered.map((row, index) => {
            const name = row.organization_display_name || row.legal_name || row.domain || 'Unknown organization'
            const trial = row.marketplace_trial_status
            return <tr key={`${row.organization_id}:${row.environment}:${row.email ?? index}`} className="hover:bg-neutral-50">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden border border-neutral-200 bg-neutral-50 text-xs font-bold">
                    {row.logo_url ? <img src={row.logo_url} alt="" className="h-full w-full object-contain p-1" /> : name.slice(0, 2).toUpperCase()}
                  </div>
                  <div><div className="font-semibold text-neutral-900">{name}</div><div className="text-xs text-neutral-500">{row.domain || row.primary_domain || '—'}</div></div>
                </div>
              </td>
              <td className="px-4 py-3"><div>{row.display_name || '—'}</div><div className="text-xs text-neutral-500">{row.email || '—'}</div></td>
              <td className="px-4 py-3 capitalize text-neutral-600">{row.source === 'marketplace' ? 'Marketplace' : row.environment || 'Provisioning'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded px-2 py-1 text-xs font-medium ${trial === 'active' ? 'bg-green-100 text-green-900' : trial === 'ended' ? 'bg-neutral-100 text-neutral-600' : 'bg-neutral-50 text-neutral-500'}`}>
                  {trial === 'active' ? `Active · ${row.marketplace_trial_days_remaining ?? '?'}d left` : trial === 'ended' ? 'Expired' : row.environment === 'government' ? 'Offline / contract' : 'Not started'}
                </span>
              </td>
              <td className="px-4 py-3 text-neutral-600">{formatDate(row.marketplace_trial_ends_at)}</td>
              <td className="px-4 py-3">{row.deployment_count ?? 0}</td>
              <td className="px-4 py-3 text-neutral-600">{formatDate(row.last_seen_at)}</td>
            </tr>
          })}
        </tbody>
      </table>
      {!filtered.length && <div className="px-4 py-12 text-center text-sm text-neutral-500">{loading ? 'Loading accounts…' : 'No accounts found. New provisioning and Marketplace trial customers will appear automatically.'}</div>}
    </div>
  </section>
}
