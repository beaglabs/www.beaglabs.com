"use client"

import { Activity, Building2, Cloud, Loader2, LogIn, LogOut, Mail, RefreshCw, ServerCog, Settings2, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LicenseControlPlaneError, licenseFetch, licensingCallbackUrl } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }
type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type Overview = { leadCount: number; newLeadCount: number; customerCount: number; marketplaceCustomerCount: number; analyticsConfigured: boolean; lastSync?: Row | null }
type Tab = 'overview' | 'leads' | 'customers' | 'marketplace' | 'deployments' | 'activity' | 'settings'

const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'leads', label: 'Leads', icon: Mail },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'marketplace', label: 'Marketplace', icon: Cloud },
  { id: 'deployments', label: 'Deployments', icon: ServerCog },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings2 },
]

function text(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function dateTime(value: unknown): string {
  if (!value) return '—'
  const d = new Date(String(value))
  if (Number.isNaN(d.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(d)
}

function statusClass(value: unknown) {
  const status = String(value ?? '').toLowerCase()
  if (['active', 'customer', 'qualified', 'completed', 'licensed', 'registered'].includes(status)) return 'bg-[#d9f99d]'
  if (['new', 'contacted', 'started', 'prospect'].includes(status)) return 'bg-[#fff0a6]'
  if (['closed', 'failed', 'suspended', 'revoked'].includes(status)) return 'bg-[#fecaca]'
  return 'bg-white'
}

function Status({ value }: { value: unknown }) {
  return <span className={`${statusClass(value)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]`}>{String(value ?? 'unknown')}</span>
}

function CustomerLogo({ row }: { row: Row }) {
  const [failed, setFailed] = useState(false)
  const url = text(row, 'logo_url')
  if (url !== '—' && !failed) {
    return <img src={url} alt="" onError={() => setFailed(true)} className="h-11 w-11 border-2 border-[#111] bg-white object-contain p-1" />
  }
  return (
    <div className="grid h-11 w-11 grid-cols-2 gap-[2px] border-2 border-[#111] bg-white p-2" title="Microsoft Marketplace customer">
      <span className="bg-[#f25022]" /><span className="bg-[#7fba00]" /><span className="bg-[#00a4ef]" /><span className="bg-[#ffb900]" />
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border-2 border-dashed border-[#aaa] bg-[#FAFAF9] px-5 py-8 text-center text-[13px] font-semibold text-[#777]">{children}</div>
}

export function MarketplaceConsole() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [overview, setOverview] = useState<Overview>({ leadCount: 0, newLeadCount: 0, customerCount: 0, marketplaceCustomerCount: 0, analyticsConfigured: false })
  const [leads, setLeads] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Row[]>([])
  const [usage, setUsage] = useState<Row[]>([])
  const [deployments, setDeployments] = useState<Row[]>([])
  const [activity, setActivity] = useState<Row[]>([])

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [o, l, c, u, d, a] = await Promise.all([
        licenseFetch<Overview>('/api/v1/marketplace/overview'),
        licenseFetch<Collection>('/api/v1/marketplace/leads?limit=250'),
        licenseFetch<Collection>('/api/v1/marketplace/customers?limit=250'),
        licenseFetch<Collection>('/api/v1/marketplace/usage?limit=250'),
        licenseFetch<Collection>('/api/v1/deployments?limit=250'),
        licenseFetch<Collection>('/api/v1/marketplace/activity?limit=100'),
      ])
      setOverview(o); setLeads(l.items); setCustomers(c.items); setUsage(u.items); setDeployments(d.items); setActivity(a.items)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) setAdmin(null)
      else toast.error(error instanceof Error ? error.message : 'Unable to load Marketplace operations.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    void licenseFetch<{ admin: Admin }>('/api/v1/me').then((r) => setAdmin(r.admin)).catch((error) => {
      if (!(error instanceof LicenseControlPlaneError && error.status === 401)) toast.error(error instanceof Error ? error.message : 'Unable to verify administrator session.')
      setAdmin(null)
    }).finally(() => setChecking(false))
  }, [])

  useEffect(() => { if (admin) void loadAll() }, [admin, loadAll])

  const signIn = async () => {
    setSigningIn(true)
    try {
      const r = await licenseFetch<{ url?: string }>('/api/auth/sign-in/social', { method: 'POST', body: JSON.stringify({ provider: 'microsoft', callbackURL: licensingCallbackUrl('/licensing'), errorCallbackURL: licensingCallbackUrl('/licensing?auth=error') }) })
      if (!r.url) throw new Error('Microsoft sign-in did not return an authorization URL.')
      window.location.assign(r.url)
    } catch (error) { setSigningIn(false); toast.error(error instanceof Error ? error.message : 'Unable to sign in.') }
  }

  const signOut = async () => { try { await licenseFetch('/api/auth/sign-out', { method: 'POST', body: '{}' }) } catch {} setAdmin(null) }

  const updateLead = async (leadId: string, status: string) => {
    try {
      await licenseFetch(`/api/v1/marketplace/leads/${encodeURIComponent(leadId)}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      setLeads((rows) => rows.map((row) => text(row, 'id') === leadId ? { ...row, status } : row))
      toast.success('Lead status updated.')
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to update lead.') }
  }

  const sync = async () => {
    setSyncing(true)
    try {
      const r = await licenseFetch<{ recordsSeen: number; recordsWritten: number }>('/api/v1/marketplace/sync', { method: 'POST', body: '{}' })
      toast.success(`Marketplace sync complete: ${r.recordsWritten}/${r.recordsSeen} records.`)
      await loadAll()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Marketplace sync failed.') }
    finally { setSyncing(false) }
  }

  const recentActivity = useMemo(() => activity.slice(0, 8), [activity])

  if (checking) return <div className="flex min-h-[520px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[11px] font-bold uppercase"><Loader2 className="h-4 w-4 animate-spin" /> Checking administrator session</div></div>

  if (!admin) return (
    <div className="mx-auto max-w-[760px] border-[3px] border-[#111] bg-white p-8 shadow-[8px_8px_0_#ff5f1f] lg:p-10">
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5f1f]">Private Azure channel operations</span>
      <h2 className="mt-3 text-[34px] font-extrabold tracking-[-0.04em]">Administrator sign in</h2>
      <p className="mt-4 text-[14px] font-medium leading-6 text-[#666]">Microsoft Azure leads, private-offer/SKU observations, VM usage, deployments, and activity are available only to the Beag Labs Entra admin allowlist.</p>
      <button onClick={signIn} disabled={signingIn} className="nb-btn-orange mt-8 flex w-full items-center justify-center gap-2 px-5 py-4 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:opacity-60">{signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Continue with Microsoft</button>
    </div>
  )

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <div className="flex flex-col gap-4 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] md:flex-row md:items-center md:justify-between">
        <div><div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#777]">Azure channel administrator</div><div className="mt-1 text-[16px] font-extrabold">{admin.name || admin.email || 'Beag Labs Admin'}</div></div>
        <div className="flex flex-wrap gap-3"><button onClick={() => void loadAll()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><button onClick={() => void sync()} disabled={syncing} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase disabled:opacity-60"><Cloud className="h-3.5 w-3.5" /> {syncing ? 'Syncing…' : 'Sync Marketplace'}</button><button onClick={() => void signOut()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><LogOut className="h-3.5 w-3.5" /> Sign out</button></div>
      </div>

      <div className="overflow-x-auto border-[3px] border-[#111] bg-[#111] p-2"><div className="flex min-w-max gap-2">{tabs.map((item) => { const Icon = item.icon; const active = item.id === tab; return <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] ${active ? 'border-[#111] bg-[#ff5f1f]' : 'border-white/40 bg-white'}`}><Icon className="h-3.5 w-3.5" />{item.label}</button> })}</div></div>

      {tab === 'overview' && <div className="space-y-8">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
          ['Azure leads', overview.leadCount, Mail, '#fff0a6'],
          ['New leads', overview.newLeadCount, Activity, '#ffd7c7'],
          ['Customers', overview.customerCount, Building2, '#fff'],
          ['Observed Azure customers', overview.marketplaceCustomerCount, Cloud, '#d9f99d'],
        ].map(([label, value, Icon, bg]) => <div key={String(label)} className="border-[3px] border-[#111] p-5 shadow-[5px_5px_0_#111]" style={{ background: String(bg) }}><div className="flex justify-between"><div><div className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#666]">{String(label)}</div><div className="mt-2 text-[38px] font-extrabold">{String(value)}</div></div><Icon className="h-5 w-5" /></div></div>)}</div>
        <section className="nb-panel overflow-hidden"><div className="border-b-[3px] border-[#111] p-6"><span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Recent Azure channel activity</span></div>{recentActivity.length === 0 ? <div className="p-6"><Empty>No Azure channel activity yet.</Empty></div> : <div>{recentActivity.map((row) => <div key={`${text(row,'kind')}-${text(row,'id')}`} className="flex items-center justify-between gap-4 border-b border-[#ddd] px-5 py-4 last:border-0"><div><div className="font-extrabold">{text(row,'title')}</div><div className="mt-1 text-[12px] text-[#777]">{text(row,'kind')} · {text(row,'offer')} · {text(row,'detail')}</div></div><div className="text-right"><Status value={row.status} /><div className="mt-2 text-[11px] text-[#777]">{dateTime(row.occurred_at)}</div></div></div>)}</div>}</section>
      </div>}

      {tab === 'leads' && <section className="nb-panel overflow-hidden"><div className="border-b-[3px] border-[#111] p-6"><h2 className="text-[26px] font-extrabold">Microsoft Azure leads</h2><p className="mt-2 text-[13px] text-[#666]">Each signed lead automatically creates or updates the CRM customer and opens the existing Resend reply thread. Licensing and commercial terms remain customer/entitlement records rather than Marketplace plan state.</p></div>{leads.length === 0 ? <div className="p-6"><Empty>No leads received yet.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase"><tr><th className="p-4">Contact</th><th className="p-4">Company</th><th className="p-4">Offer</th><th className="p-4">Received</th><th className="p-4">Stage</th></tr></thead><tbody>{leads.map((row) => <tr key={text(row,'id')} className="border-t-2 border-[#111]"><td className="p-4"><div className="font-extrabold">{text(row,'first_name')} {text(row,'last_name')}</div><div className="text-[12px] text-[#777]">{text(row,'email')}</div></td><td className="p-4"><div className="flex items-center gap-3"><CustomerLogo row={row} /><div><div className="font-extrabold">{text(row,'organization_name','company_name')}</div><div className="text-[11px] text-[#777]">{text(row,'country')}</div></div></div></td><td className="p-4 text-[12px] font-semibold">{text(row,'offer_title')}</td><td className="p-4 text-[12px]">{dateTime(row.received_at)}</td><td className="p-4"><select className="nb-input py-2 text-[11px]" value={text(row,'status') === '—' ? 'new' : text(row,'status')} onChange={(e) => void updateLead(text(row,'id'), e.target.value)}>{['new','contacted','qualified','customer','closed'].map((s) => <option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div>}</section>}

      {tab === 'customers' && <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{customers.length === 0 ? <div className="md:col-span-2 xl:col-span-3"><Empty>No Marketplace customers yet.</Empty></div> : customers.map((row) => <article key={text(row,'id')} className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]"><div className="flex items-start gap-4"><CustomerLogo row={row} /><div className="min-w-0"><div className="truncate text-[17px] font-extrabold">{text(row,'display_name','legal_name')}</div><div className="mt-1 text-[12px] text-[#777]">{text(row,'contact_name')} · {text(row,'contact_email')}</div></div></div><div className="mt-5 grid grid-cols-2 gap-3 text-[11px]"><div><div className="font-mono text-[9px] font-black uppercase text-[#777]">Offer</div>{text(row,'offer_name')}</div><div><div className="font-mono text-[9px] font-black uppercase text-[#777]">Azure SKU</div>{text(row,'sku')}</div><div><div className="font-mono text-[9px] font-black uppercase text-[#777]">Leads</div>{text(row,'lead_count')}</div><div><div className="font-mono text-[9px] font-black uppercase text-[#777]">Last seen</div>{dateTime(row.last_marketplace_seen_at ?? row.last_lead_at)}</div></div></article>)}</div>}

      {tab === 'marketplace' && <section className="nb-panel overflow-hidden"><div className="border-b-[3px] border-[#111] p-6"><h2 className="text-[26px] font-extrabold">Azure Marketplace observations</h2><p className="mt-2 text-[13px] text-[#666]">Partner Center ISVUsage remains useful for Azure channel and VM observations. It is not the licensing source of truth; signed rights come from Beag Labs customer entitlements.</p></div>{usage.length === 0 ? <div className="p-6"><Empty>No VM usage observations yet. Configure Partner Center analytics access or use Sync Marketplace.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase"><tr><th className="p-4">Customer</th><th className="p-4">Offer / SKU</th><th className="p-4">VM</th><th className="p-4">Channel</th><th className="p-4">Last seen</th></tr></thead><tbody>{usage.map((row) => <tr key={text(row,'id')} className="border-t-2 border-[#111]"><td className="p-4"><div className="flex items-center gap-3"><CustomerLogo row={row} /><div><div className="font-extrabold">{text(row,'organization_name','customer_company_name')}</div><div className="text-[11px] text-[#777]">{text(row,'customer_country')}</div></div></div></td><td className="p-4"><div className="font-semibold">{text(row,'offer_name')}</div><div className="text-[11px] text-[#777]">{text(row,'sku')}</div></td><td className="p-4 text-[12px]">{text(row,'vm_size')} · {text(row,'cloud_instance_name')}</td><td className="p-4 text-[12px]">{text(row,'azure_license_type')}</td><td className="p-4 text-[12px]">{dateTime(row.last_seen_at)}</td></tr>)}</tbody></table></div>}</section>}

      {tab === 'deployments' && <section className="nb-panel overflow-hidden"><div className="border-b-[3px] border-[#111] p-6"><h2 className="text-[26px] font-extrabold">Papyrus deployments</h2><p className="mt-2 text-[13px] text-[#666]">Operational view only. Organization licenses may cover many VMs without one Beag deployment record per VM; deployment-bound records remain available for exceptions.</p></div>{deployments.length === 0 ? <div className="p-6"><Empty>No registered deployments yet.</Empty></div> : <div>{deployments.map((row) => <div key={text(row,'id')} className="flex items-center justify-between border-b border-[#ddd] px-5 py-4 last:border-0"><div><div className="font-extrabold">{text(row,'deployment_name')}</div><div className="text-[11px] text-[#777]">{text(row,'deployment_profile')} · {text(row,'papyrus_deployment_id')}</div></div><Status value={row.status} /></div>)}</div>}</section>}

      {tab === 'activity' && <section className="nb-panel overflow-hidden">{activity.length === 0 ? <div className="p-6"><Empty>No Azure channel activity yet.</Empty></div> : activity.map((row) => <div key={`${text(row,'kind')}-${text(row,'id')}`} className="flex items-center justify-between gap-4 border-b border-[#ddd] px-5 py-4 last:border-0"><div><div className="font-extrabold">{text(row,'title')}</div><div className="text-[12px] text-[#777]">{text(row,'kind')} · {text(row,'offer')} · {text(row,'detail')}</div></div><div className="text-right"><Status value={row.status} /><div className="mt-2 text-[11px] text-[#777]">{dateTime(row.occurred_at)}</div></div></div>)}</section>}

      {tab === 'settings' && <div className="grid gap-6 lg:grid-cols-2"><section className="nb-panel p-6"><div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Lead webhook</div><h2 className="mt-3 text-[22px] font-extrabold">Signed Logic App forwarder</h2><div className="mt-5 space-y-3 font-mono text-[11px]"><div className="border-2 border-[#111] bg-[#FAFAF9] p-3 break-all">POST https://license.beaglabs.com/api/marketplace/leads</div><div className="border-2 border-[#111] bg-[#FAFAF9] p-3">X-Beag-Timestamp: &lt;unix-ms-or-ISO&gt;</div><div className="border-2 border-[#111] bg-[#FAFAF9] p-3">X-Beag-Signature: sha256=&lt;HMAC-SHA256(secret, timestamp + '.' + rawBody)&gt;</div></div></section><section className="nb-panel p-6"><div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">VM analytics</div><h2 className="mt-3 text-[22px] font-extrabold">Partner Center ISVUsage sync</h2><p className="mt-3 text-[13px] text-[#666]">Automatic Worker cron runs every six hours; Microsoft documents up to 48 hours of Marketplace analytics latency.</p><div className="mt-5"><Status value={overview.analyticsConfigured ? 'configured' : 'not configured'} /></div><div className="mt-4 text-[12px] text-[#777]">Last sync: {dateTime(overview.lastSync?.completed_at ?? overview.lastSync?.started_at)}</div></section></div>}
    </div>
  )
}
