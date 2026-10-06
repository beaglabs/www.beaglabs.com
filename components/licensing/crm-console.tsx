"use client"

import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  FileKey2,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  PackageCheck,
  RefreshCw,
  RotateCcw,
  ShoppingCart,
  UserPlus,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { CrmAvatar } from './crm-avatar'
import { CrmDataTable, type CrmColumn } from './crm-data-table'
import { OrganizationLicensePanel } from './organization-license-panel'
import {
  LicenseControlPlaneError,
  licenseFetch,
  licensingCallbackUrl,
} from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }
type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type Dashboard = {
  people: number
  customers: number
  openOpportunities: number
  pipelineValueCents: number
  orders: number
  bookedValueCents: number
  followUpsDue: number
}
type Tab = 'overview' | 'people' | 'customers' | 'opportunities' | 'orders' | 'licensing' | 'audit' | 'settings'

const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'people', label: 'People', icon: Users },
  { id: 'customers', label: 'Customers', icon: Building2 },
  { id: 'opportunities', label: 'Opportunities', icon: BriefcaseBusiness },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'licensing', label: 'Licensing', icon: PackageCheck },
  { id: 'audit', label: 'Audit', icon: Activity },
  { id: 'settings', label: 'Settings', icon: RotateCcw },
]

function text(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function numberValue(row: Row, ...keys: string[]): number {
  for (const key of keys) {
    const value = Number(row[key])
    if (Number.isFinite(value)) return value
  }
  return 0
}

function money(cents: unknown): string {
  const value = Number(cents)
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value / 100)
}

function dateTime(value: unknown): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

function statusClass(value: unknown): string {
  const normalized = String(value ?? '').toLowerCase()
  if (['active','customer','qualified','booked','fulfilled','closed_won','active_customer'].includes(normalized)) return 'bg-[#d9f99d]'
  if (['new','contacted','prospect','identified','pilot_proposed','technical_validation','procurement','verbal','draft','nurture'].includes(normalized)) return 'bg-[#fff0a6]'
  if (['inactive','closed','closed_lost','cancelled','refunded','archived','do_not_contact'].includes(normalized)) return 'bg-[#fecaca]'
  return 'bg-white'
}

function Status({ value }: { value: unknown }) {
  return <span className={`${statusClass(value)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]`}>{String(value ?? 'unknown').replaceAll('_',' ')}</span>
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="font-mono text-[9px] font-black uppercase tracking-[0.12em] text-[#555]">{label}</span>
      {children}
      {hint ? <span className="block text-[11px] font-medium leading-5 text-[#777]">{hint}</span> : null}
    </label>
  )
}

function PanelTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div>
      <span className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#ff5f1f]">{eyebrow}</span>
      <h2 className="mt-2 text-[25px] font-extrabold tracking-[-0.035em]">{title}</h2>
      {copy ? <p className="mt-2 max-w-3xl text-[13px] font-medium leading-6 text-[#666]">{copy}</p> : null}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border-2 border-dashed border-[#aaa] bg-[#FAFAF9] px-5 py-8 text-center text-[13px] font-semibold text-[#777]">{children}</div>
}

export function CrmConsole() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')
  const [dashboard, setDashboard] = useState<Dashboard>({ people: 0, customers: 0, openOpportunities: 0, pipelineValueCents: 0, orders: 0, bookedValueCents: 0, followUpsDue: 0 })
  const [people, setPeople] = useState<Row[]>([])
  const [customers, setCustomers] = useState<Row[]>([])
  const [opportunities, setOpportunities] = useState<Row[]>([])
  const [orders, setOrders] = useState<Row[]>([])
  const [products, setProducts] = useState<Row[]>([])
  const [entitlements, setEntitlements] = useState<Row[]>([])
  const [audit, setAudit] = useState<Row[]>([])
  const [issuance, setIssuance] = useState<{ issuanceId: string; document: Record<string, unknown> } | null>(null)
  const [resetConfirm, setResetConfirm] = useState('')

  const [personForm, setPersonForm] = useState({
    firstName: '', lastName: '', title: '', email: '', phone: '', linkedinUrl: '', organizationId: '',
    leadStage: 'new', leadSource: 'LinkedIn',
  })
  const [customerForm, setCustomerForm] = useState({
    organizationType: 'federal_agency', legalName: '', displayName: '', uei: '', cageCode: '', domain: '', websiteUrl: '',
  })
  const [opportunityForm, setOpportunityForm] = useState({
    customerOrganizationId: '', name: '', stage: 'identified', estimatedValueDollars: '', expectedCloseDate: '',
  })
  const [orderForm, setOrderForm] = useState({
    customerOrganizationId: '', sku: '', unitPriceDollars: '', status: 'booked', opportunityId: '',
  })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [d, p, c, o, ord, prod, ent, aud] = await Promise.all([
        licenseFetch<Dashboard>('/api/v2/crm/dashboard'),
        licenseFetch<Collection>('/api/v2/crm/people?limit=500'),
        licenseFetch<Collection>('/api/v2/crm/customers?limit=500'),
        licenseFetch<Collection>('/api/v2/crm/opportunities?limit=500'),
        licenseFetch<Collection>('/api/v2/crm/orders?limit=500'),
        licenseFetch<Collection>('/api/v1/products'),
        licenseFetch<Collection>('/api/v1/entitlements?limit=500'),
        licenseFetch<Collection>('/api/v1/audit?limit=250'),
      ])
      setDashboard(d); setPeople(p.items); setCustomers(c.items); setOpportunities(o.items); setOrders(ord.items)
      setProducts(prod.items); setEntitlements(ent.items); setAudit(aud.items)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) setAdmin(null)
      else toast.error(error instanceof Error ? error.message : 'Unable to load CRM data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void licenseFetch<{ admin: Admin }>('/api/v1/me')
      .then((result) => setAdmin(result.admin))
      .catch((error) => {
        if (!(error instanceof LicenseControlPlaneError && error.status === 401)) toast.error(error instanceof Error ? error.message : 'Unable to verify administrator session.')
        setAdmin(null)
      })
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => { if (admin) void loadAll() }, [admin, loadAll])

  const signIn = async () => {
    setSigningIn(true)
    try {
      const result = await licenseFetch<{ url?: string }>('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({ provider: 'microsoft', callbackURL: licensingCallbackUrl('/licensing'), errorCallbackURL: licensingCallbackUrl('/licensing?auth=error') }),
      })
      if (!result.url) throw new Error('Microsoft sign-in did not return an authorization URL.')
      window.location.assign(result.url)
    } catch (error) {
      setSigningIn(false)
      toast.error(error instanceof Error ? error.message : 'Unable to start Microsoft sign-in.')
    }
  }

  const signOut = async () => {
    try { await licenseFetch('/api/auth/sign-out', { method: 'POST', body: '{}' }) } catch {}
    setAdmin(null)
  }

  const createPerson = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v2/crm/people', {
        method: 'POST',
        body: JSON.stringify({
          ...personForm,
          organizationId: personForm.organizationId || null,
          title: personForm.title || null,
          email: personForm.email || null,
          phone: personForm.phone || null,
          linkedinUrl: personForm.linkedinUrl || null,
          leadSource: personForm.leadSource || null,
        }),
      })
      toast.success('Person added to CRM.')
      setPersonForm({ firstName: '', lastName: '', title: '', email: '', phone: '', linkedinUrl: '', organizationId: '', leadStage: 'new', leadSource: 'LinkedIn' })
      await loadAll()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create person.') }
  }

  const createCustomer = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v2/crm/customers', {
        method: 'POST',
        body: JSON.stringify({
          ...customerForm,
          displayName: customerForm.displayName || null,
          uei: customerForm.uei || null,
          cageCode: customerForm.cageCode || null,
          domain: customerForm.domain || null,
          websiteUrl: customerForm.websiteUrl || null,
          status: 'prospect',
          accountStage: 'prospect',
        }),
      })
      toast.success('Customer account created.')
      setCustomerForm({ organizationType: 'federal_agency', legalName: '', displayName: '', uei: '', cageCode: '', domain: '', websiteUrl: '' })
      await loadAll()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create customer.') }
  }

  const createOpportunity = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const value = opportunityForm.estimatedValueDollars.trim() ? Number(opportunityForm.estimatedValueDollars) : null
      if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error('Enter a valid estimated value.')
      await licenseFetch('/api/v2/crm/opportunities', {
        method: 'POST',
        body: JSON.stringify({
          customerOrganizationId: opportunityForm.customerOrganizationId,
          name: opportunityForm.name,
          stage: opportunityForm.stage,
          estimatedValueCents: value === null ? null : Math.round(value * 100),
          expectedCloseDate: opportunityForm.expectedCloseDate || null,
        }),
      })
      toast.success('Opportunity created.')
      setOpportunityForm({ customerOrganizationId: '', name: '', stage: 'identified', estimatedValueDollars: '', expectedCloseDate: '' })
      await loadAll()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create opportunity.') }
  }

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const value = orderForm.unitPriceDollars.trim() ? Number(orderForm.unitPriceDollars) : null
      if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error('Enter a valid agreed price.')
      await licenseFetch('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerOrganizationId: orderForm.customerOrganizationId,
          opportunityId: orderForm.opportunityId || null,
          status: orderForm.status,
          currency: 'USD',
          items: [{ sku: orderForm.sku, quantity: 1, discountCents: 0, ...(value !== null ? { unitPriceCents: Math.round(value * 100) } : {}) }],
        }),
      })
      toast.success('Commercial order recorded.')
      setOrderForm({ customerOrganizationId: '', sku: '', unitPriceDollars: '', status: 'booked', opportunityId: '' })
      await loadAll()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to create order.') }
  }

  const resetCrm = async () => {
    if (resetConfirm !== 'RESET CRM DATA') return
    if (!window.confirm('Clear all CRM/customer/order/licensing business data? Authentication and the product catalog will be preserved.')) return
    try {
      const result = await licenseFetch<{ cleared: Record<string, number> }>('/api/v2/crm/admin/reset', {
        method: 'POST',
        body: JSON.stringify({ confirm: resetConfirm }),
      })
      toast.success(`CRM cleared across ${Object.keys(result.cleared).length} tables.`)
      setResetConfirm('')
      await loadAll()
    } catch (error) { toast.error(error instanceof Error ? error.message : 'Unable to reset CRM.') }
  }

  const peopleColumns = useMemo<CrmColumn<Row>[]>(() => [
    {
      id: 'person', label: 'Person', sortValue: (row) => `${text(row,'last_name')} ${text(row,'first_name')}`,
      render: (row) => <div className="flex items-center gap-3"><CrmAvatar firstName={text(row,'first_name')} lastName={text(row,'last_name')} avatarUrl={row.avatar_url ? String(row.avatar_url) : null} linkedinUrl={row.linkedin_url ? String(row.linkedin_url) : null} /><div><div className="font-extrabold">{text(row,'first_name')} {text(row,'last_name')}</div><div className="mt-1 text-[11px] text-[#777]">{text(row,'title')}</div></div></div>,
    },
    { id: 'account', label: 'Account', sortValue: (row) => text(row,'organization_name'), render: (row) => <div><div className="font-bold">{text(row,'organization_name')}</div><div className="mt-1 text-[10px] text-[#888]">{row.organization_id ? 'Linked customer' : 'Unattached lead'}</div></div> },
    { id: 'stage', label: 'Stage', sortValue: (row) => text(row,'lead_stage'), render: (row) => <Status value={row.lead_stage} /> },
    { id: 'email', label: 'Email', sortValue: (row) => text(row,'email'), render: (row) => <span className="text-[12px] font-semibold">{text(row,'email')}</span> },
    { id: 'followup', label: 'Follow up', sortValue: (row) => text(row,'next_follow_up_at'), render: (row) => <span className="text-[12px]">{dateTime(row.next_follow_up_at)}</span> },
  ], [])

  const customerColumns = useMemo<CrmColumn<Row>[]>(() => [
    {
      id: 'customer', label: 'Customer', sortValue: (row) => text(row,'display_name','legal_name'),
      render: (row) => <div className="flex items-center gap-3">{row.logo_url ? <img src={String(row.logo_url)} alt="" className="h-10 w-10 border-2 border-[#111] bg-white object-contain p-1 shadow-[2px_2px_0_#111]" /> : <div className="flex h-10 w-10 items-center justify-center border-2 border-[#111] bg-[#ffd7c7] font-mono text-[11px] font-black shadow-[2px_2px_0_#111]">{text(row,'legal_name').slice(0,2).toUpperCase()}</div>}<div><div className="font-extrabold">{text(row,'display_name','legal_name')}</div><div className="mt-1 text-[11px] text-[#777]">{text(row,'organization_type').replaceAll('_',' ')}</div></div></div>,
    },
    { id: 'stage', label: 'Stage', sortValue: (row) => text(row,'account_stage','status'), render: (row) => <Status value={row.account_stage ?? row.status} /> },
    { id: 'people', label: 'People', sortValue: (row) => numberValue(row,'people_count'), render: (row) => <span className="font-mono font-black">{numberValue(row,'people_count')}</span> },
    { id: 'opps', label: 'Open opps', sortValue: (row) => numberValue(row,'opportunity_count'), render: (row) => <span className="font-mono font-black">{numberValue(row,'opportunity_count')}</span> },
    { id: 'uei', label: 'UEI / CAGE', sortValue: (row) => text(row,'uei'), render: (row) => <span className="font-mono text-[10px]">{text(row,'uei')} / {text(row,'cage_code')}</span> },
  ], [])

  const opportunityColumns = useMemo<CrmColumn<Row>[]>(() => [
    { id: 'name', label: 'Opportunity', sortValue: (row) => text(row,'name'), render: (row) => <div><div className="font-extrabold">{text(row,'name')}</div><div className="mt-1 text-[11px] text-[#777]">{text(row,'customer_name')}</div></div> },
    { id: 'stage', label: 'Stage', sortValue: (row) => text(row,'stage'), render: (row) => <Status value={row.stage} /> },
    { id: 'value', label: 'Value', sortValue: (row) => numberValue(row,'estimated_value_cents'), render: (row) => <span className="font-mono text-[12px] font-black">{money(row.estimated_value_cents)}</span> },
    { id: 'close', label: 'Expected close', sortValue: (row) => text(row,'expected_close_date'), render: (row) => <span className="text-[12px]">{dateTime(row.expected_close_date)}</span> },
    { id: 'refs', label: 'Refs / files', sortValue: (row) => numberValue(row,'reference_count') + numberValue(row,'attachment_count'), render: (row) => <span className="font-mono text-[10px] font-black">{numberValue(row,'reference_count')} refs · {numberValue(row,'attachment_count')} files</span> },
  ], [])

  const dashboardCards: Array<[string, number, typeof Users, string]> = [
    ['People', dashboard.people, Users, '#fff0a6'],
    ['Customer accounts', dashboard.customers, Building2, '#fff'],
    ['Open opportunities', dashboard.openOpportunities, BriefcaseBusiness, '#ffd7c7'],
    ['Follow-ups due', dashboard.followUpsDue, Activity, '#d9f99d'],
  ]

  const orderColumns = useMemo<CrmColumn<Row>[]>(() => [
    { id: 'customer', label: 'Customer', sortValue: (row) => text(row,'customer_name'), render: (row) => <div><div className="font-extrabold">{text(row,'customer_name')}</div><div className="mt-1 font-mono text-[9px] text-[#888]">{text(row,'id')}</div></div> },
    { id: 'status', label: 'Status', sortValue: (row) => text(row,'status'), render: (row) => <Status value={row.status} /> },
    { id: 'total', label: 'Total', sortValue: (row) => numberValue(row,'total_cents'), render: (row) => <span className="font-mono text-[12px] font-black">{money(row.total_cents)}</span> },
    { id: 'contract', label: 'Contract', sortValue: (row) => text(row,'contract_number'), render: (row) => <span className="font-mono text-[10px]">{text(row,'contract_number')}</span> },
    { id: 'refs', label: 'Refs / files', sortValue: (row) => numberValue(row,'reference_count') + numberValue(row,'attachment_count'), render: (row) => <span className="font-mono text-[10px] font-black">{numberValue(row,'reference_count')} refs · {numberValue(row,'attachment_count')} files</span> },
  ], [])

  if (checking) return <div className="flex min-h-[520px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[11px] font-bold uppercase"><Loader2 className="h-4 w-4 animate-spin" /> Checking administrator session</div></div>

  if (!admin) {
    return (
      <div className="mx-auto max-w-[760px] border-[3px] border-[#111] bg-white p-8 shadow-[8px_8px_0_#ff5f1f] lg:p-10">
        <div className="mb-8 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f] shadow-[4px_4px_0_#111]"><KeyRound className="h-6 w-6" /></div>
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5f1f]">Private commercial CRM</span>
        <h2 className="mt-3 text-[34px] font-extrabold tracking-[-0.04em]">Administrator sign in</h2>
        <p className="mt-4 text-[14px] font-medium leading-6 text-[#666]">People, customer accounts, contract records, files, orders, and license issuance are restricted to the Beag Labs Entra administrator allowlist.</p>
        <button onClick={signIn} disabled={signingIn} className="nb-btn-orange mt-8 flex w-full items-center justify-center gap-2 px-5 py-4 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:opacity-60">{signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Continue with Microsoft</button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] space-y-8">
      <div className="flex flex-col gap-4 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-[3px] border-[#111] bg-[#d9f99d]"><CheckCircle2 className="h-5 w-5" /></div>
          <div><div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#777]">Commercial administrator</div><div className="mt-1 text-[16px] font-extrabold">{admin.name || admin.email || 'Beag Labs Admin'}</div></div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => void loadAll()} disabled={loading} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button onClick={() => void signOut()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </div>

      <div className="overflow-x-auto border-[3px] border-[#111] bg-[#111] p-2">
        <div className="flex min-w-max gap-2">{tabs.map((item) => { const Icon = item.icon; const active = tab === item.id; return <button key={item.id} onClick={() => setTab(item.id)} className={`flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] ${active ? 'border-[#111] bg-[#ff5f1f]' : 'border-white/40 bg-white'}`}><Icon className="h-3.5 w-3.5" />{item.label}</button> })}</div>
      </div>

      {tab === 'overview' && (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardCards.map(([label,value,Icon,bg]) => <div key={label} className="border-[3px] border-[#111] p-5 shadow-[5px_5px_0_#111]" style={{background:bg}}><div className="flex justify-between"><div><div className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#666]">{label}</div><div className="mt-2 text-[38px] font-extrabold">{value}</div></div><Icon className="h-5 w-5" /></div></div>)}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="nb-panel p-6"><PanelTitle eyebrow="Pipeline" title={money(dashboard.pipelineValueCents)} copy="Estimated value across opportunities that are still open." /><div className="mt-6 border-t-2 border-[#111] pt-5 font-mono text-[11px] font-black uppercase">{dashboard.openOpportunities} open opportunities</div></section>
            <section className="nb-panel p-6"><PanelTitle eyebrow="Booked business" title={money(dashboard.bookedValueCents)} copy="Recorded value across booked and fulfilled commercial orders." /><div className="mt-6 border-t-2 border-[#111] pt-5 font-mono text-[11px] font-black uppercase">{dashboard.orders} orders</div></section>
          </div>
          <section className="border-[3px] border-[#111] bg-[#111] p-6 text-white shadow-[6px_6px_0_#ff5f1f]">
            <div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff9b70]">Operating model</div>
            <h2 className="mt-3 text-[26px] font-extrabold">Person → Account → Opportunity → Order → Entitlement.</h2>
            <p className="mt-3 max-w-4xl text-[14px] leading-6 text-[#ccc]">A lead can exist before an account. Attach the person once the buying organization is known, then link the same person to opportunities and orders with a role. SAM.gov IDs, prime contract IDs, files, and notes stay on the record they actually belong to.</p>
          </section>
        </div>
      )}

      {tab === 'people' && (
        <div className="space-y-8">
          <section className="nb-panel p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><PanelTitle eyebrow="People" title="Leads & contacts" copy="Track people before or after they are attached to a customer account. LinkedIn profile images are resolved server-side when possible." /><div className="border-2 border-[#111] bg-[#fff0a6] px-3 py-2 font-mono text-[9px] font-black uppercase">{people.length} people</div></div>
            <form onSubmit={createPerson} className="mt-6 grid gap-4 border-t-2 border-[#111] pt-6 md:grid-cols-2 xl:grid-cols-4">
              <Field label="First name"><input required className="nb-input w-full" value={personForm.firstName} onChange={(e)=>setPersonForm({...personForm,firstName:e.target.value})} /></Field>
              <Field label="Last name"><input required className="nb-input w-full" value={personForm.lastName} onChange={(e)=>setPersonForm({...personForm,lastName:e.target.value})} /></Field>
              <Field label="Title"><input className="nb-input w-full" value={personForm.title} onChange={(e)=>setPersonForm({...personForm,title:e.target.value})} placeholder="Program Manager" /></Field>
              <Field label="Email"><input type="email" className="nb-input w-full" value={personForm.email} onChange={(e)=>setPersonForm({...personForm,email:e.target.value})} /></Field>
              <Field label="LinkedIn URL" hint="Used to resolve and cache the profile image when public metadata is available."><input type="url" className="nb-input w-full" value={personForm.linkedinUrl} onChange={(e)=>setPersonForm({...personForm,linkedinUrl:e.target.value})} placeholder="https://www.linkedin.com/in/…" /></Field>
              <Field label="Customer account"><select className="nb-input w-full" value={personForm.organizationId} onChange={(e)=>setPersonForm({...personForm,organizationId:e.target.value})}><option value="">Unattached lead</option>{customers.map((row)=><option key={text(row,'id')} value={text(row,'id')}>{text(row,'display_name','legal_name')}</option>)}</select></Field>
              <Field label="Lead stage"><select className="nb-input w-full" value={personForm.leadStage} onChange={(e)=>setPersonForm({...personForm,leadStage:e.target.value})}>{['new','contacted','qualified','nurture','customer','closed','do_not_contact'].map((value)=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select></Field>
              <div className="flex items-end"><button className="nb-btn-orange inline-flex w-full items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] font-black uppercase"><UserPlus className="h-4 w-4" /> Add person</button></div>
            </form>
          </section>
          <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
            <CrmDataTable rows={people} columns={peopleColumns} rowKey={(row)=>text(row,'id')} searchText={(row)=>[text(row,'first_name'),text(row,'last_name'),text(row,'title'),text(row,'email'),text(row,'organization_name'),text(row,'linkedin_url')].join(' ')} searchPlaceholder="Search people, titles, accounts, LinkedIn…" empty="No people yet." onRowClick={(row)=>window.location.assign(`/licensing/people/${encodeURIComponent(text(row,'id'))}`)} />
          </section>
        </div>
      )}

      {tab === 'customers' && (
        <div className="space-y-8">
          <section className="nb-panel p-6 lg:p-7">
            <PanelTitle eyebrow="Accounts" title="Customer organizations" copy="Accounts own opportunities, orders, entitlements, procurement references, files, and linked people." />
            <form onSubmit={createCustomer} className="mt-6 grid gap-4 border-t-2 border-[#111] pt-6 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Type"><select className="nb-input w-full" value={customerForm.organizationType} onChange={(e)=>setCustomerForm({...customerForm,organizationType:e.target.value})}>{['federal_agency','state_local','commercial','prime','distributor','reseller','integrator','partner'].map((value)=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select></Field>
              <Field label="Legal name"><input required className="nb-input w-full" value={customerForm.legalName} onChange={(e)=>setCustomerForm({...customerForm,legalName:e.target.value})} /></Field>
              <Field label="Display name"><input className="nb-input w-full" value={customerForm.displayName} onChange={(e)=>setCustomerForm({...customerForm,displayName:e.target.value})} /></Field>
              <Field label="Domain"><input className="nb-input w-full" value={customerForm.domain} onChange={(e)=>setCustomerForm({...customerForm,domain:e.target.value})} placeholder="agency.gov" /></Field>
              <Field label="UEI"><input className="nb-input w-full font-mono" value={customerForm.uei} onChange={(e)=>setCustomerForm({...customerForm,uei:e.target.value})} /></Field>
              <Field label="CAGE"><input className="nb-input w-full font-mono" value={customerForm.cageCode} onChange={(e)=>setCustomerForm({...customerForm,cageCode:e.target.value})} /></Field>
              <Field label="Website"><input type="url" className="nb-input w-full" value={customerForm.websiteUrl} onChange={(e)=>setCustomerForm({...customerForm,websiteUrl:e.target.value})} /></Field>
              <div className="flex items-end"><button className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase">Create account</button></div>
            </form>
          </section>
          <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
            <CrmDataTable rows={customers} columns={customerColumns} rowKey={(row)=>text(row,'id')} searchText={(row)=>[text(row,'legal_name'),text(row,'display_name'),text(row,'uei'),text(row,'cage_code'),text(row,'domain')].join(' ')} searchPlaceholder="Search accounts, UEI, CAGE, domain…" empty="No customer accounts yet." onRowClick={(row)=>window.location.assign(`/licensing/customers/${encodeURIComponent(text(row,'id'))}`)} />
          </section>
        </div>
      )}

      {tab === 'opportunities' && (
        <div className="space-y-8">
          <section className="nb-panel p-6 lg:p-7">
            <PanelTitle eyebrow="Pipeline" title="Opportunities" copy="Track the buying motion independently from the eventual order. SAM.gov and prime-contract references belong in the opportunity drilldown." />
            <form onSubmit={createOpportunity} className="mt-6 grid gap-4 border-t-2 border-[#111] pt-6 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Customer"><select required className="nb-input w-full" value={opportunityForm.customerOrganizationId} onChange={(e)=>setOpportunityForm({...opportunityForm,customerOrganizationId:e.target.value})}><option value="">Select account…</option>{customers.map((row)=><option key={text(row,'id')} value={text(row,'id')}>{text(row,'display_name','legal_name')}</option>)}</select></Field>
              <Field label="Opportunity name"><input required className="nb-input w-full" value={opportunityForm.name} onChange={(e)=>setOpportunityForm({...opportunityForm,name:e.target.value})} /></Field>
              <Field label="Stage"><select className="nb-input w-full" value={opportunityForm.stage} onChange={(e)=>setOpportunityForm({...opportunityForm,stage:e.target.value})}>{['identified','qualified','pilot_proposed','technical_validation','procurement','verbal','closed_won','closed_lost'].map((value)=><option key={value} value={value}>{value.replaceAll('_',' ')}</option>)}</select></Field>
              <Field label="Est. value"><input type="number" min="0" step="0.01" className="nb-input w-full" value={opportunityForm.estimatedValueDollars} onChange={(e)=>setOpportunityForm({...opportunityForm,estimatedValueDollars:e.target.value})} /></Field>
              <div className="flex items-end"><button className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase">Create opportunity</button></div>
            </form>
          </section>
          <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
            <CrmDataTable rows={opportunities} columns={opportunityColumns} rowKey={(row)=>text(row,'id')} searchText={(row)=>[text(row,'name'),text(row,'customer_name'),text(row,'stage')].join(' ')} searchPlaceholder="Search opportunities and customers…" empty="No opportunities yet." onRowClick={(row)=>window.location.assign(`/licensing/opportunities/${encodeURIComponent(text(row,'id'))}`)} />
          </section>
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-8">
          <section className="nb-panel p-6 lg:p-7">
            <PanelTitle eyebrow="Commercial records" title="Orders" copy="Record the negotiated software transaction here. Open the order to attach SAM.gov notice/award IDs, prime contract IDs, people, and contract files." />
            <form onSubmit={createOrder} className="mt-6 grid gap-4 border-t-2 border-[#111] pt-6 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Customer"><select required className="nb-input w-full" value={orderForm.customerOrganizationId} onChange={(e)=>setOrderForm({...orderForm,customerOrganizationId:e.target.value,opportunityId:''})}><option value="">Select account…</option>{customers.map((row)=><option key={text(row,'id')} value={text(row,'id')}>{text(row,'display_name','legal_name')}</option>)}</select></Field>
              <Field label="Internal SKU"><select required className="nb-input w-full" value={orderForm.sku} onChange={(e)=>setOrderForm({...orderForm,sku:e.target.value})}><option value="">Select SKU…</option>{products.filter((row)=>text(row,'provisioning_type')==='license').map((row)=><option key={text(row,'sku')} value={text(row,'sku')}>{text(row,'sku')} — {text(row,'name')}</option>)}</select></Field>
              <Field label="Agreed price"><input type="number" min="0" step="0.01" className="nb-input w-full" value={orderForm.unitPriceDollars} onChange={(e)=>setOrderForm({...orderForm,unitPriceDollars:e.target.value})} /></Field>
              <Field label="Opportunity"><select className="nb-input w-full" value={orderForm.opportunityId} onChange={(e)=>setOrderForm({...orderForm,opportunityId:e.target.value})}><option value="">None</option>{opportunities.filter((row)=>!orderForm.customerOrganizationId || text(row,'customer_organization_id')===orderForm.customerOrganizationId).map((row)=><option key={text(row,'id')} value={text(row,'id')}>{text(row,'name')}</option>)}</select></Field>
              <div className="flex items-end"><button className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase">Record order</button></div>
            </form>
          </section>
          <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
            <CrmDataTable rows={orders} columns={orderColumns} rowKey={(row)=>text(row,'id')} searchText={(row)=>[text(row,'customer_name'),text(row,'id'),text(row,'contract_number'),text(row,'po_number'),text(row,'status')].join(' ')} searchPlaceholder="Search orders, customers, contract IDs…" empty="No orders yet." onRowClick={(row)=>window.location.assign(`/licensing/orders/${encodeURIComponent(text(row,'id'))}`)} />
          </section>
        </div>
      )}

      {tab === 'licensing' && (
        <div className="space-y-8">
          <section className="nb-panel overflow-hidden">
            <div className="border-b-[3px] border-[#111] p-6"><PanelTitle eyebrow="Commercial rights" title={`${entitlements.length} entitlements`} copy="Licensing stays downstream of the CRM: a booked order creates the entitlement, then approved organization scope becomes the signed offline license." /></div>
            {entitlements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left"><thead className="bg-[#111] font-mono text-[9px] font-black uppercase text-white"><tr><th className="p-4">Customer</th><th className="p-4">SKU</th><th className="p-4">Status</th><th className="p-4">Valid until</th><th className="p-4">ID</th></tr></thead><tbody>{entitlements.map((row)=><tr key={text(row,'id')} className="border-b-2 border-[#111]"><td className="p-4 font-extrabold">{text(row,'customer_name')}</td><td className="p-4 font-mono text-[10px]">{text(row,'sku')}</td><td className="p-4"><Status value={row.status}/></td><td className="p-4 text-[12px]">{dateTime(row.valid_until)}</td><td className="p-4 font-mono text-[9px]">{text(row,'id')}</td></tr>)}</tbody></table></div> : <div className="p-6"><Empty>No entitlements yet.</Empty></div>}
          </section>
          <OrganizationLicensePanel entitlements={entitlements} onIssued={(result)=>setIssuance(result)} />
          {issuance ? <section className="border-[3px] border-[#111] bg-[#d9f99d] p-6 shadow-[6px_6px_0_#111]"><div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase"><FileKey2 className="h-4 w-4"/> Signed license ready</div><pre className="mt-4 max-h-[360px] overflow-auto border-2 border-[#111] bg-[#111] p-4 text-[10px] text-white">{JSON.stringify(issuance.document,null,2)}</pre></section> : null}
        </div>
      )}

      {tab === 'audit' && (
        <section className="overflow-hidden border-[3px] border-[#111] bg-white shadow-[6px_6px_0_#111]">
          <CrmDataTable
            rows={audit}
            rowKey={(row)=>text(row,'id')}
            searchText={(row)=>[text(row,'action'),text(row,'resource_type'),text(row,'resource_id'),text(row,'actor_id')].join(' ')}
            searchPlaceholder="Search audit events…"
            empty="No audit events yet."
            columns={[
              {id:'time',label:'Time',sortValue:(row)=>text(row,'created_at'),render:(row)=><span className="text-[12px]">{dateTime(row.created_at)}</span>},
              {id:'action',label:'Action',sortValue:(row)=>text(row,'action'),render:(row)=><span className="font-mono text-[10px] font-black">{text(row,'action')}</span>},
              {id:'resource',label:'Resource',sortValue:(row)=>text(row,'resource_type'),render:(row)=><div><div className="font-bold">{text(row,'resource_type')}</div><div className="font-mono text-[9px] text-[#777]">{text(row,'resource_id')}</div></div>},
              {id:'actor',label:'Actor',sortValue:(row)=>text(row,'actor_id'),render:(row)=><span className="font-mono text-[9px]">{text(row,'actor_id')}</span>},
            ]}
          />
        </section>
      )}

      {tab === 'settings' && (
        <div className="grid gap-8 lg:grid-cols-2">
          <section className="nb-panel p-6"><PanelTitle eyebrow="Data model" title="CRM reset" copy="Clear customer, lead, opportunity, order, deployment, entitlement, Marketplace, reference, file metadata, and audit data while preserving the product catalog and Better Auth/JWKS tables." /><div className="mt-6 border-[3px] border-[#111] bg-[#fee2e2] p-5"><div className="font-mono text-[10px] font-black uppercase">Danger zone</div><p className="mt-2 text-[12px] leading-5">R2 objects are also deleted when the attachment bucket is configured. This cannot be undone.</p><input className="nb-input mt-4 w-full font-mono text-[11px]" value={resetConfirm} onChange={(e)=>setResetConfirm(e.target.value)} placeholder="Type RESET CRM DATA" /><button type="button" disabled={resetConfirm!=='RESET CRM DATA'} onClick={()=>void resetCrm()} className="mt-3 inline-flex w-full items-center justify-center gap-2 border-[3px] border-[#111] bg-[#ef4444] px-4 py-3 font-mono text-[10px] font-black uppercase text-white shadow-[4px_4px_0_#111] disabled:opacity-40"><RotateCcw className="h-4 w-4"/> Clear CRM data</button></div></section>
          <section className="nb-panel p-6"><PanelTitle eyebrow="Storage" title="Contract attachments" copy="Files are stored in the private Cloudflare R2 CRM_ATTACHMENTS binding. Metadata remains in Turso and downloads are authenticated through license.beaglabs.com." /><div className="mt-6 space-y-3 font-mono text-[10px] font-black uppercase"><div className="border-2 border-[#111] bg-[#FAFAF9] p-3">Bucket: beaglabs-license-attachments</div><div className="border-2 border-[#111] bg-[#FAFAF9] p-3">Max file size: 25 MB</div><div className="border-2 border-[#111] bg-[#FAFAF9] p-3">Auth: Entra admin session</div></div></section>
        </div>
      )}
    </div>
  )
}
