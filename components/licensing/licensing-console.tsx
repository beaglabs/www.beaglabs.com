"use client"

import {
  Activity,
  Building2,
  CheckCircle2,
  ClipboardCopy,
  FileKey2,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  PackageCheck,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import {
  LicenseControlPlaneError,
  licenseFetch,
  licensingCallbackUrl,
} from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }
type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type AdminResponse = { admin: Admin }
type LicenseIssuance = { issuanceId: string; document: Record<string, unknown> }
type Tab = 'overview' | 'customers' | 'orders' | 'entitlements' | 'deployments' | 'audit'

const tabs: Array<{ id: Tab; label: string; icon: typeof Activity }> = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'customers', label: 'Customers', icon: Building2 },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'entitlements', label: 'Entitlements', icon: PackageCheck },
  { id: 'deployments', label: 'Deployments', icon: ServerCog },
  { id: 'audit', label: 'Audit', icon: ShieldCheck },
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
  if (cents === null || cents === undefined || cents === '') return 'Quote required'
  const value = Number(cents)
  if (!Number.isFinite(value)) return 'Quote required'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value / 100)
}

function dateTime(value: unknown): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed)
}

function shortId(value: unknown, length = 14): string {
  const raw = String(value ?? '')
  if (!raw) return '—'
  return raw.length <= length ? raw : `${raw.slice(0, length)}…`
}

function statusClass(status: string): string {
  const normalized = status.toLowerCase()
  if (['active', 'licensed', 'booked', 'fulfilled', 'registered'].includes(normalized)) {
    return 'bg-[#d9f99d]'
  }
  if (['pending', 'draft', 'prospect'].includes(normalized)) return 'bg-[#fff0a6]'
  if (['revoked', 'suspended', 'cancelled', 'expired', 'inactive'].includes(normalized)) return 'bg-[#fecaca]'
  return 'bg-white'
}

function Status({ value }: { value: unknown }) {
  const label = String(value ?? 'unknown')
  return (
    <span className={`${statusClass(label)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.08em]`}>
      {label}
    </span>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-2">
      <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#333]">
        {label}
      </span>
      {children}
      {hint ? <span className="block text-[12px] font-medium leading-5 text-[#777]">{hint}</span> : null}
    </label>
  )
}

function PanelTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-6">
      <span className="mb-3 inline-block font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff5f1f]">
        {eyebrow}
      </span>
      <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.03em] text-[#111]">{title}</h2>
      {copy ? <p className="mt-2 max-w-2xl text-[14px] font-medium leading-6 text-[#666]">{copy}</p> : null}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-2 border-dashed border-[#aaa] bg-[#FAFAF9] px-5 py-8 text-center text-[13px] font-semibold text-[#777]">
      {children}
    </div>
  )
}

export function LicensingConsole() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [loading, setLoading] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [tab, setTab] = useState<Tab>('overview')

  const [products, setProducts] = useState<Row[]>([])
  const [organizations, setOrganizations] = useState<Row[]>([])
  const [orders, setOrders] = useState<Row[]>([])
  const [entitlements, setEntitlements] = useState<Row[]>([])
  const [deployments, setDeployments] = useState<Row[]>([])
  const [audit, setAudit] = useState<Row[]>([])
  const [orderItems, setOrderItems] = useState<Row[]>([])
  const [issuance, setIssuance] = useState<LicenseIssuance | null>(null)

  const [orgForm, setOrgForm] = useState({ legalName: '', displayName: '', organizationType: 'federal_agency' })
  const [orderForm, setOrderForm] = useState({ customerOrganizationId: '', sku: 'PAP-FED-PILOT-90', quantity: '1', status: 'booked' })
  const [entitlementForm, setEntitlementForm] = useState({ orderId: '', orderItemId: '' })
  const [deploymentForm, setDeploymentForm] = useState({
    entitlementId: '',
    deploymentName: '',
    papyrusDeploymentId: '',
    deploymentProfile: 'government',
    entraAppLogoUrl: '',
  })
  const [brandingForm, setBrandingForm] = useState({ deploymentId: '', entraAppLogoUrl: '' })

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [productResult, orgResult, orderResult, entitlementResult, deploymentResult, auditResult] = await Promise.all([
        licenseFetch<Collection>('/api/v1/products'),
        licenseFetch<Collection>('/api/v1/organizations?limit=250'),
        licenseFetch<Collection>('/api/v1/orders?limit=250'),
        licenseFetch<Collection>('/api/v1/entitlements?limit=250'),
        licenseFetch<Collection>('/api/v1/deployments?limit=250'),
        licenseFetch<Collection>('/api/v1/audit?limit=250'),
      ])
      setProducts(productResult.items)
      setOrganizations(orgResult.items)
      setOrders(orderResult.items)
      setEntitlements(entitlementResult.items)
      setDeployments(deploymentResult.items)
      setAudit(auditResult.items)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) {
        setAdmin(null)
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load licensing data.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const checkSession = useCallback(async () => {
    setCheckingSession(true)
    try {
      const result = await licenseFetch<AdminResponse>('/api/v1/me')
      setAdmin(result.admin)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) {
        setAdmin(null)
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to verify administrator session.')
      }
    } finally {
      setCheckingSession(false)
    }
  }, [])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  useEffect(() => {
    if (admin) void loadAll()
  }, [admin, loadAll])

  useEffect(() => {
    if (!entitlementForm.orderId) {
      setOrderItems([])
      return
    }
    void licenseFetch<Row & { items?: Row[] }>(`/api/v1/orders/${encodeURIComponent(entitlementForm.orderId)}`)
      .then((result) => {
        const items = Array.isArray(result.items) ? result.items : []
        setOrderItems(items)
        setEntitlementForm((current) => ({ ...current, orderItemId: items[0] ? text(items[0], 'id') : '' }))
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load order items.'))
  }, [entitlementForm.orderId])

  const startAdminSignIn = async () => {
    setSigningIn(true)
    try {
      const result = await licenseFetch<{ url?: string }>('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'microsoft',
          callbackURL: licensingCallbackUrl('/licensing'),
          errorCallbackURL: licensingCallbackUrl('/licensing?auth=error'),
        }),
      })
      if (!result.url) throw new Error('Microsoft sign-in did not return an authorization URL.')
      window.location.assign(result.url)
    } catch (error) {
      setSigningIn(false)
      toast.error(error instanceof Error ? error.message : 'Unable to start Microsoft sign-in.')
    }
  }

  const signOut = async () => {
    try {
      await licenseFetch('/api/auth/sign-out', { method: 'POST', body: '{}' })
    } catch {
      // Clear local state even if the server session already expired.
    }
    setAdmin(null)
    setProducts([])
    setOrganizations([])
    setOrders([])
    setEntitlements([])
    setDeployments([])
    setAudit([])
  }

  const createOrganization = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v1/organizations', {
        method: 'POST',
        body: JSON.stringify({
          organizationType: orgForm.organizationType,
          legalName: orgForm.legalName,
          displayName: orgForm.displayName || null,
          status: 'active',
        }),
      })
      toast.success('Customer organization created.')
      setOrgForm({ legalName: '', displayName: '', organizationType: 'federal_agency' })
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create customer.')
    }
  }

  const createOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v1/orders', {
        method: 'POST',
        body: JSON.stringify({
          customerOrganizationId: orderForm.customerOrganizationId,
          status: orderForm.status,
          currency: 'USD',
          items: [{
            sku: orderForm.sku,
            quantity: Number(orderForm.quantity),
            discountCents: 0,
          }],
        }),
      })
      toast.success(orderForm.status === 'booked' ? 'Order booked.' : 'Draft order created.')
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create order.')
    }
  }

  const createEntitlement = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/v1/entitlements', {
        method: 'POST',
        body: JSON.stringify({
          orderItemId: entitlementForm.orderItemId,
          validFrom: new Date().toISOString(),
          notes: 'Issued from Beag Labs licensing console',
        }),
      })
      toast.success('Entitlement created.')
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create entitlement.')
    }
  }

  const generateDeploymentId = () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32))
    const id = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
    setDeploymentForm((current) => ({ ...current, papyrusDeploymentId: id }))
  }

  const createDeployment = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      const body: Record<string, unknown> = {
        entitlementId: deploymentForm.entitlementId,
        deploymentName: deploymentForm.deploymentName,
        papyrusDeploymentId: deploymentForm.papyrusDeploymentId,
        deploymentProfile: deploymentForm.deploymentProfile,
      }
      if (deploymentForm.entraAppLogoUrl.trim()) body.entraAppLogoUrl = deploymentForm.entraAppLogoUrl.trim()

      await licenseFetch('/api/v1/deployments', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      toast.success('Papyrus deployment registered.')
      setDeploymentForm({
        entitlementId: '',
        deploymentName: '',
        papyrusDeploymentId: '',
        deploymentProfile: 'government',
        entraAppLogoUrl: '',
      })
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to register deployment.')
    }
  }

  const updateBranding = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch(`/api/v1/deployments/${encodeURIComponent(brandingForm.deploymentId)}/branding`, {
        method: 'PUT',
        body: JSON.stringify({ entraAppLogoUrl: brandingForm.entraAppLogoUrl.trim() || null }),
      })
      toast.success('Deployment branding updated. Reissue the license to deliver the change.')
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update branding.')
    }
  }

  const issueLicense = async (deploymentId: string) => {
    try {
      const result = await licenseFetch<LicenseIssuance>(`/api/v1/deployments/${encodeURIComponent(deploymentId)}/licenses`, {
        method: 'POST',
        body: '{}',
      })
      setIssuance(result)
      toast.success('Azure Key Vault signed the license.')
      await loadAll()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to issue license.')
    }
  }

  const downloadIssuance = () => {
    if (!issuance) return
    const blob = new Blob([JSON.stringify(issuance.document, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${String(issuance.document.licenseId ?? issuance.issuanceId)}.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const copyKeyId = async () => {
    const keyId = issuance?.document.keyId
    if (!keyId) return
    await navigator.clipboard.writeText(String(keyId))
    toast.success('Signing key ID copied.')
  }

  const activeEntitlements = useMemo(
    () => entitlements.filter((row) => text(row, 'status') === 'active').length,
    [entitlements],
  )

  if (checkingSession) {
    return (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking administrator session
        </div>
      </div>
    )
  }

  if (!admin) {
    return (
      <div className="mx-auto grid max-w-[1180px] gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
        <section className="border-[3px] border-[#111] bg-[#111] p-8 text-white shadow-[8px_8px_0px_0px_#ff5f1f] lg:p-10">
          <div className="mb-14 flex items-center gap-3">
            <span className="border-2 border-white bg-[#ff5f1f] px-2.5 py-1 font-mono text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#111]">
              Private administration
            </span>
          </div>
          <h2 className="max-w-[620px] text-[36px] font-extrabold leading-[0.98] tracking-[-0.045em] lg:text-[50px]">
            Licensing operations without putting the signing key in the app.
          </h2>
          <p className="mt-6 max-w-[590px] text-[16px] font-medium leading-7 text-[#d5d5d5]">
            Orders, entitlements, deployment binding, branding, audit, and signed Papyrus license issuance stay behind the dedicated licensing control plane. Production signatures are produced by the version-pinned Azure Key Vault key.
          </p>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              ['01', 'Entra admin allowlist'],
              ['02', 'Turso source of truth'],
              ['03', 'HSM-backed signing'],
            ].map(([step, label]) => (
              <div key={step} className="border-2 border-white/50 p-4">
                <div className="font-mono text-[10px] font-black tracking-[0.14em] text-[#ff5f1f]">{step}</div>
                <div className="mt-2 text-[13px] font-bold">{label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="nb-panel flex flex-col justify-between p-8 lg:p-10">
          <div>
            <div className="mb-8 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f] shadow-[4px_4px_0px_0px_#111]">
              <KeyRound className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="font-mono text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#ff5f1f]">Beag Labs licensing</span>
            <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.04em]">Administrator sign in</h2>
            <p className="mt-4 text-[14px] font-medium leading-6 text-[#666]">
              Use the Beag Labs Microsoft Entra account whose immutable object ID is on the licensing administrator allowlist.
            </p>
          </div>
          <button
            type="button"
            onClick={startAdminSignIn}
            disabled={signingIn}
            className="nb-btn-orange mt-10 flex w-full items-center justify-center gap-3 px-5 py-4 font-mono text-[11px] font-extrabold uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Continue with Microsoft
          </button>
          <p className="mt-5 text-center font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#999]">
            Authentication and session state remain on license.beaglabs.com
          </p>
        </section>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px]">
      <div className="mb-8 flex flex-col gap-5 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0px_0px_#111] md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-[#111] bg-[#d9f99d]">
            <CheckCircle2 className="h-5 w-5" strokeWidth={3} />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[9px] font-black uppercase tracking-[0.16em] text-[#777]">Authenticated administrator</div>
            <div className="truncate text-[15px] font-extrabold text-[#111]">{admin.name || admin.email || 'Beag Labs Admin'}</div>
            <div className="truncate font-mono text-[9px] text-[#888]">OID {admin.oid}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void loadAll()} disabled={loading} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button type="button" onClick={() => void signOut()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em]">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto border-[3px] border-[#111] bg-[#111] p-2">
        <div className="flex min-w-max gap-2">
          {tabs.map((item) => {
            const Icon = item.icon
            const active = tab === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 border-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] transition-transform ${active ? 'border-[#111] bg-[#ff5f1f] text-[#111]' : 'border-white/40 bg-white text-[#111] hover:-translate-y-0.5'}`}
              >
                <Icon className="h-3.5 w-3.5" /> {item.label}
              </button>
            )
          })}
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Customers', organizations.length, Building2, '#ffffff'],
              ['Booked / draft orders', orders.length, ShoppingCart, '#fff0a6'],
              ['Active entitlements', activeEntitlements, PackageCheck, '#d9f99d'],
              ['Deployments', deployments.length, ServerCog, '#ffd7c7'],
            ].map(([label, value, Icon, background]) => (
              <div key={String(label)} className="border-[3px] border-[#111] p-5 shadow-[5px_5px_0px_0px_#111]" style={{ background: String(background) }}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#666]">{String(label)}</div>
                    <div className="mt-2 text-[38px] font-extrabold leading-none tracking-[-0.05em]">{String(value)}</div>
                  </div>
                  <Icon className="h-5 w-5" strokeWidth={2.5} />
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="nb-panel p-6 lg:p-8">
              <PanelTitle eyebrow="Provisioning path" title="Order → entitlement → deployment → signed license" copy="Each state transition is explicit and audited. Deployment identity and provisioned branding are derived from licensing records before Azure Key Vault signs the final document." />
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ['1', 'Book order', 'Select an active Papyrus SKU and the legal customer entity.'],
                  ['2', 'Issue entitlement', 'Activate the purchased feature set and term.'],
                  ['3', 'Bind deployment', 'Register the exact Papyrus deployment ID and runtime profile.'],
                  ['4', 'Sign license', 'Azure Key Vault signs the canonical deployment-bound payload.'],
                ].map(([n, title, copy]) => (
                  <div key={n} className="border-2 border-[#111] bg-[#FAFAF9] p-4">
                    <div className="mb-3 inline-flex h-7 w-7 items-center justify-center border-2 border-[#111] bg-[#ff5f1f] font-mono text-[10px] font-black">{n}</div>
                    <div className="text-[14px] font-extrabold">{title}</div>
                    <p className="mt-1 text-[12px] font-medium leading-5 text-[#666]">{copy}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-[3px] border-[#111] bg-[#111] p-6 text-white shadow-[6px_6px_0px_0px_#ff5f1f] lg:p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-[#ff5f1f]" />
                <div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Signing posture</div>
              </div>
              <h2 className="mt-5 text-[27px] font-extrabold tracking-[-0.035em]">Private key stays in Azure Key Vault.</h2>
              <p className="mt-4 text-[14px] font-medium leading-6 text-[#ccc]">The Worker sends a SHA-256 digest to the version-pinned RSA-HSM key for RS256 signing. Papyrus verifies with the corresponding public authority key.</p>
              <div className="mt-7 space-y-3 font-mono text-[10px] font-bold uppercase tracking-[0.08em] text-[#ddd]">
                <div className="border border-white/30 p-3">✓ HSM-backed authority key</div>
                <div className="border border-white/30 p-3">✓ Deployment-bound payload</div>
                <div className="border border-white/30 p-3">✓ Fail-closed issuance</div>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      {tab === 'customers' ? (
        <div className="grid gap-8 xl:grid-cols-[0.72fr_1.28fr]">
          <form onSubmit={createOrganization} className="nb-panel h-fit p-6 lg:p-8">
            <PanelTitle eyebrow="Customer record" title="Create organization" copy="Use the contracting/legal entity that should own orders, entitlements, deployments, and audit history." />
            <div className="space-y-5">
              <Field label="Organization type">
                <select className="nb-input w-full" value={orgForm.organizationType} onChange={(event) => setOrgForm((current) => ({ ...current, organizationType: event.target.value }))}>
                  <option value="federal_agency">Federal agency</option>
                  <option value="state_local">State / local</option>
                  <option value="commercial">Commercial</option>
                  <option value="prime">Prime contractor</option>
                  <option value="distributor">Distributor</option>
                  <option value="reseller">Reseller</option>
                  <option value="integrator">Integrator</option>
                  <option value="partner">Partner</option>
                </select>
              </Field>
              <Field label="Legal name">
                <input className="nb-input w-full" required value={orgForm.legalName} onChange={(event) => setOrgForm((current) => ({ ...current, legalName: event.target.value }))} placeholder="U.S. Department of Example" />
              </Field>
              <Field label="Display name" hint="Optional shorthand used in the console.">
                <input className="nb-input w-full" value={orgForm.displayName} onChange={(event) => setOrgForm((current) => ({ ...current, displayName: event.target.value }))} placeholder="Example Agency" />
              </Field>
              <button className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Create customer</button>
            </div>
          </form>

          <section className="nb-panel overflow-hidden">
            <div className="border-b-[3px] border-[#111] p-6"><PanelTitle eyebrow="Source of truth" title={`${organizations.length} customer organizations`} /></div>
            {organizations.length === 0 ? <div className="p-6"><Empty>No customer organizations yet.</Empty></div> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left">
                  <thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]">
                    <tr><th className="border-b-2 border-[#111] px-5 py-3">Organization</th><th className="border-b-2 border-[#111] px-5 py-3">Type</th><th className="border-b-2 border-[#111] px-5 py-3">UEI / CAGE</th><th className="border-b-2 border-[#111] px-5 py-3">Status</th><th className="border-b-2 border-[#111] px-5 py-3">ID</th></tr>
                  </thead>
                  <tbody>
                    {organizations.map((row) => <tr key={text(row, 'id')} className="border-b border-[#ddd] last:border-0">
                      <td className="px-5 py-4"><div className="font-extrabold">{text(row, 'display_name', 'legal_name')}</div><div className="mt-1 text-[12px] text-[#777]">{text(row, 'legal_name')}</div></td>
                      <td className="px-5 py-4 text-[13px] font-semibold">{text(row, 'organization_type')}</td>
                      <td className="px-5 py-4 font-mono text-[10px]">{text(row, 'uei')} / {text(row, 'cage_code')}</td>
                      <td className="px-5 py-4"><Status value={row.status} /></td>
                      <td className="px-5 py-4 font-mono text-[10px] text-[#777]" title={text(row, 'id')}>{shortId(row.id)}</td>
                    </tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : null}

      {tab === 'orders' ? (
        <div className="grid gap-8 xl:grid-cols-[0.76fr_1.24fr]">
          <form onSubmit={createOrder} className="nb-panel h-fit p-6 lg:p-8">
            <PanelTitle eyebrow="Commercial record" title="Create Papyrus order" copy="Book the customer purchase before issuing an entitlement. Quote-required SKUs can still be recorded with their agreed order price through the API." />
            <div className="space-y-5">
              <Field label="Customer">
                <select required className="nb-input w-full" value={orderForm.customerOrganizationId} onChange={(event) => setOrderForm((current) => ({ ...current, customerOrganizationId: event.target.value }))}>
                  <option value="">Select customer…</option>
                  {organizations.map((row) => <option key={text(row, 'id')} value={text(row, 'id')}>{text(row, 'display_name', 'legal_name')}</option>)}
                </select>
              </Field>
              <Field label="SKU">
                <select required className="nb-input w-full" value={orderForm.sku} onChange={(event) => setOrderForm((current) => ({ ...current, sku: event.target.value }))}>
                  {products.map((row) => <option key={text(row, 'sku')} value={text(row, 'sku')}>{text(row, 'sku')} — {text(row, 'name')} — {money(row.list_price_cents)}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Quantity"><input className="nb-input w-full" type="number" min="1" max="1000" value={orderForm.quantity} onChange={(event) => setOrderForm((current) => ({ ...current, quantity: event.target.value }))} /></Field>
                <Field label="State"><select className="nb-input w-full" value={orderForm.status} onChange={(event) => setOrderForm((current) => ({ ...current, status: event.target.value }))}><option value="booked">Booked</option><option value="draft">Draft</option></select></Field>
              </div>
              <button className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Create order</button>
            </div>
          </form>

          <section className="nb-panel overflow-hidden">
            <div className="border-b-[3px] border-[#111] p-6"><PanelTitle eyebrow="Orders" title={`${orders.length} commercial records`} /></div>
            {orders.length === 0 ? <div className="p-6"><Empty>No orders yet.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]"><tr><th className="border-b-2 border-[#111] px-5 py-3">Customer</th><th className="border-b-2 border-[#111] px-5 py-3">Status</th><th className="border-b-2 border-[#111] px-5 py-3">Total</th><th className="border-b-2 border-[#111] px-5 py-3">Ordered</th><th className="border-b-2 border-[#111] px-5 py-3">Order ID</th></tr></thead><tbody>{orders.map((row) => <tr key={text(row, 'id')} className="border-b border-[#ddd] last:border-0"><td className="px-5 py-4 font-extrabold">{text(row, 'customer_name', 'customer_organization_id')}</td><td className="px-5 py-4"><Status value={row.status} /></td><td className="px-5 py-4 font-mono text-[11px] font-bold">{money(row.total_cents)}</td><td className="px-5 py-4 text-[12px] font-medium text-[#666]">{dateTime(row.ordered_at ?? row.created_at)}</td><td className="px-5 py-4 font-mono text-[10px] text-[#777]" title={text(row, 'id')}>{shortId(row.id)}</td></tr>)}</tbody></table></div>}
          </section>
        </div>
      ) : null}

      {tab === 'entitlements' ? (
        <div className="grid gap-8 xl:grid-cols-[0.76fr_1.24fr]">
          <form onSubmit={createEntitlement} className="nb-panel h-fit p-6 lg:p-8">
            <PanelTitle eyebrow="Grant" title="Issue entitlement" copy="Entitlements can only be created from booked order items. Product term, features, deployment limit, and allowed profiles are derived server-side." />
            <div className="space-y-5">
              <Field label="Booked order">
                <select required className="nb-input w-full" value={entitlementForm.orderId} onChange={(event) => setEntitlementForm({ orderId: event.target.value, orderItemId: '' })}>
                  <option value="">Select order…</option>
                  {orders.filter((row) => text(row, 'status') === 'booked').map((row) => <option key={text(row, 'id')} value={text(row, 'id')}>{text(row, 'customer_name')} — {shortId(row.id, 18)}</option>)}
                </select>
              </Field>
              <Field label="Order item">
                <select required className="nb-input w-full" value={entitlementForm.orderItemId} onChange={(event) => setEntitlementForm((current) => ({ ...current, orderItemId: event.target.value }))} disabled={!entitlementForm.orderId}>
                  <option value="">Select item…</option>
                  {orderItems.map((row) => <option key={text(row, 'id')} value={text(row, 'id')}>{text(row, 'sku', 'product_id')} × {numberValue(row, 'quantity')}</option>)}
                </select>
              </Field>
              <button disabled={!entitlementForm.orderItemId} className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:cursor-not-allowed disabled:opacity-50">Issue entitlement</button>
            </div>
          </form>

          <section className="nb-panel overflow-hidden">
            <div className="border-b-[3px] border-[#111] p-6"><PanelTitle eyebrow="Entitlements" title={`${entitlements.length} grants`} /></div>
            {entitlements.length === 0 ? <div className="p-6"><Empty>No entitlements yet.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[840px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]"><tr><th className="border-b-2 border-[#111] px-5 py-3">ID</th><th className="border-b-2 border-[#111] px-5 py-3">Status</th><th className="border-b-2 border-[#111] px-5 py-3">Valid from</th><th className="border-b-2 border-[#111] px-5 py-3">Valid until</th><th className="border-b-2 border-[#111] px-5 py-3">Deployments</th></tr></thead><tbody>{entitlements.map((row) => <tr key={text(row, 'id')} className="border-b border-[#ddd] last:border-0"><td className="px-5 py-4 font-mono text-[10px]" title={text(row, 'id')}>{shortId(row.id, 20)}</td><td className="px-5 py-4"><Status value={row.status} /></td><td className="px-5 py-4 text-[12px] font-medium">{dateTime(row.valid_from)}</td><td className="px-5 py-4 text-[12px] font-medium">{dateTime(row.valid_until)}</td><td className="px-5 py-4 font-mono text-[11px] font-bold">{numberValue(row, 'deployment_limit')}</td></tr>)}</tbody></table></div>}
          </section>
        </div>
      ) : null}

      {tab === 'deployments' ? (
        <div className="space-y-8">
          <div className="grid gap-8 xl:grid-cols-2">
            <form onSubmit={createDeployment} className="nb-panel p-6 lg:p-8">
              <PanelTitle eyebrow="Deployment binding" title="Register Papyrus deployment" copy="Bind an entitlement to the exact Papyrus deployment ID and runtime profile. Optional Entra branding is signed into the license payload." />
              <div className="space-y-5">
                <Field label="Entitlement">
                  <select required className="nb-input w-full" value={deploymentForm.entitlementId} onChange={(event) => setDeploymentForm((current) => ({ ...current, entitlementId: event.target.value }))}>
                    <option value="">Select active entitlement…</option>
                    {entitlements.filter((row) => text(row, 'status') === 'active').map((row) => <option key={text(row, 'id')} value={text(row, 'id')}>{shortId(row.id, 24)}</option>)}
                  </select>
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Deployment name"><input required className="nb-input w-full" value={deploymentForm.deploymentName} onChange={(event) => setDeploymentForm((current) => ({ ...current, deploymentName: event.target.value }))} placeholder="Agency Production" /></Field>
                  <Field label="Profile"><select className="nb-input w-full" value={deploymentForm.deploymentProfile} onChange={(event) => setDeploymentForm((current) => ({ ...current, deploymentProfile: event.target.value }))}><option value="commercial">Commercial</option><option value="government">Government</option><option value="disconnected">Disconnected</option></select></Field>
                </div>
                <Field label="Papyrus deployment ID" hint="64 hexadecimal characters from the Papyrus activation identity. Generate is useful for end-to-end test deployments only.">
                  <div className="flex gap-2"><input required pattern="[a-fA-F0-9]{64}" className="nb-input min-w-0 flex-1 font-mono text-[10px]" value={deploymentForm.papyrusDeploymentId} onChange={(event) => setDeploymentForm((current) => ({ ...current, papyrusDeploymentId: event.target.value }))} /><button type="button" onClick={generateDeploymentId} className="nb-btn-white shrink-0 px-3 font-mono text-[9px] font-black uppercase">Generate</button></div>
                </Field>
                <Field label="Entra app logo URL" hint="Optional. Provisioned branding is included only after the signed license passes verification."><input type="url" className="nb-input w-full" value={deploymentForm.entraAppLogoUrl} onChange={(event) => setDeploymentForm((current) => ({ ...current, entraAppLogoUrl: event.target.value }))} placeholder="https://…/agency-app-logo.png" /></Field>
                <button className="nb-btn-orange w-full px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Register deployment</button>
              </div>
            </form>

            <form onSubmit={updateBranding} className="nb-panel h-fit p-6 lg:p-8">
              <PanelTitle eyebrow="Provisioned branding" title="Update Entra app logo" copy="Branding is deployment provisioning state, not a Papyrus environment variable. Reissue the license after changing it." />
              <div className="space-y-5">
                <Field label="Deployment"><select required className="nb-input w-full" value={brandingForm.deploymentId} onChange={(event) => setBrandingForm((current) => ({ ...current, deploymentId: event.target.value }))}><option value="">Select deployment…</option>{deployments.map((row) => <option key={text(row, 'id')} value={text(row, 'id')}>{text(row, 'deployment_name')} — {shortId(row.id, 18)}</option>)}</select></Field>
                <Field label="Logo URL" hint="Leave blank to clear provisioned logo branding."><input type="url" className="nb-input w-full" value={brandingForm.entraAppLogoUrl} onChange={(event) => setBrandingForm((current) => ({ ...current, entraAppLogoUrl: event.target.value }))} placeholder="https://…" /></Field>
                <button disabled={!brandingForm.deploymentId} className="nb-btn-white w-full px-4 py-3 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:opacity-50">Update branding</button>
              </div>
            </form>
          </div>

          <section className="nb-panel overflow-hidden">
            <div className="border-b-[3px] border-[#111] p-6"><PanelTitle eyebrow="Deployment registry" title={`${deployments.length} Papyrus deployments`} copy="License issuance is an explicit administrator action. A signer error leaves the issuance table unchanged." /></div>
            {deployments.length === 0 ? <div className="p-6"><Empty>No registered deployments yet.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]"><tr><th className="border-b-2 border-[#111] px-5 py-3">Deployment</th><th className="border-b-2 border-[#111] px-5 py-3">Profile</th><th className="border-b-2 border-[#111] px-5 py-3">Status</th><th className="border-b-2 border-[#111] px-5 py-3">Papyrus ID</th><th className="border-b-2 border-[#111] px-5 py-3">Action</th></tr></thead><tbody>{deployments.map((row) => <tr key={text(row, 'id')} className="border-b border-[#ddd] last:border-0"><td className="px-5 py-4"><div className="font-extrabold">{text(row, 'deployment_name')}</div><div className="mt-1 font-mono text-[9px] text-[#888]">{shortId(row.id, 20)}</div></td><td className="px-5 py-4 text-[13px] font-bold">{text(row, 'deployment_profile')}</td><td className="px-5 py-4"><Status value={row.status} /></td><td className="px-5 py-4 font-mono text-[9px] text-[#666]" title={text(row, 'papyrus_deployment_id')}>{shortId(row.papyrus_deployment_id, 24)}</td><td className="px-5 py-4"><button type="button" onClick={() => void issueLicense(text(row, 'id'))} className="nb-btn-orange inline-flex items-center gap-2 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.08em]"><FileKey2 className="h-3.5 w-3.5" /> Issue signed license</button></td></tr>)}</tbody></table></div>}
          </section>

          {issuance ? (
            <section className="border-[3px] border-[#111] bg-[#d9f99d] p-6 shadow-[7px_7px_0px_0px_#111] lg:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.14em]"><Sparkles className="h-4 w-4" /> Azure Key Vault signature complete</div>
                  <h2 className="mt-3 text-[25px] font-extrabold tracking-[-0.035em]">{String(issuance.document.licenseId ?? issuance.issuanceId)}</h2>
                  <p className="mt-2 max-w-3xl text-[13px] font-semibold leading-6">The license document below is the exact signed payload returned by the production control plane.</p>
                </div>
                <div className="flex flex-wrap gap-3"><button type="button" onClick={() => void copyKeyId()} className="nb-btn-white inline-flex items-center gap-2 px-3 py-2 font-mono text-[9px] font-black uppercase"><ClipboardCopy className="h-3.5 w-3.5" /> Copy key ID</button><button type="button" onClick={downloadIssuance} className="nb-btn-white px-3 py-2 font-mono text-[9px] font-black uppercase">Download JSON</button></div>
              </div>
              <pre className="mt-6 max-h-[480px] overflow-auto border-[3px] border-[#111] bg-[#111] p-5 text-[11px] leading-5 text-[#f4f4f4]">{JSON.stringify(issuance.document, null, 2)}</pre>
            </section>
          ) : null}
        </div>
      ) : null}

      {tab === 'audit' ? (
        <section className="nb-panel overflow-hidden">
          <div className="border-b-[3px] border-[#111] p-6 lg:p-8"><PanelTitle eyebrow="Immutable operations trail" title="Licensing audit" copy="Recent administrative and partner actions recorded by the control plane. Actor IDs and resource IDs stay visible for investigation and reconciliation." /></div>
          {audit.length === 0 ? <div className="p-6"><Empty>No audit events yet.</Empty></div> : <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]"><tr><th className="border-b-2 border-[#111] px-5 py-3">Time</th><th className="border-b-2 border-[#111] px-5 py-3">Action</th><th className="border-b-2 border-[#111] px-5 py-3">Actor</th><th className="border-b-2 border-[#111] px-5 py-3">Resource</th><th className="border-b-2 border-[#111] px-5 py-3">Request</th></tr></thead><tbody>{audit.map((row, index) => <tr key={`${text(row, 'id')}-${index}`} className="border-b border-[#ddd] last:border-0"><td className="px-5 py-4 text-[12px] font-medium">{dateTime(row.created_at)}</td><td className="px-5 py-4 font-mono text-[10px] font-bold">{text(row, 'action')}</td><td className="px-5 py-4"><div className="text-[12px] font-bold">{text(row, 'actor_type')}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{shortId(row.actor_id, 24)}</div></td><td className="px-5 py-4"><div className="text-[12px] font-bold">{text(row, 'resource_type')}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{shortId(row.resource_id, 24)}</div></td><td className="px-5 py-4 font-mono text-[9px] text-[#777]">{shortId(row.request_id, 24)}</td></tr>)}</tbody></table></div>}
        </section>
      ) : null}
    </div>
  )
}
