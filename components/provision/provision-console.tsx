"use client"

import {
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Container,
  Cpu,
  ExternalLink,
  FileCheck2,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  LICENSE_CONTROL_PLANE_ORIGIN,
  LicenseControlPlaneError,
  licenseFetch,
} from '@/lib/license-control-plane'

type Environment = 'commercial' | 'government'
type Row = Record<string, unknown>

type Agreement = {
  type: string
  version: string
  title: string
  href: string
  summary: string
  accepted: boolean
}

type Me = {
  user: { oid: string; tenantId: string; email?: string | null; name?: string | null }
  environment: Environment
  organization: Row | null
  tenantProfile: {
    displayName?: string | null
    primaryDomain?: string | null
    verifiedDomains?: string[]
    logoSource?: 'entra' | 'logo_dev' | 'none'
    logoUrl?: string | null
  } | null
  accountManager: Row | null
  agreements: Agreement[]
  agreementsComplete: boolean
  capabilities: {
    marketplaceBilling: boolean
    offlineLicenses: boolean
    containers: boolean
    azureManagementConnected: boolean
  }
  pricing: { vcpuHourlyUsd: number }
}

type Section = 'deployments' | 'billing' | 'licenses' | 'organization' | 'agreements'

const sectionNames: Record<Section, string> = {
  deployments: 'Deployments',
  billing: 'Billing',
  licenses: 'Offline Licenses',
  organization: 'Organization',
  agreements: 'Agreements',
}

const sections = Object.keys(sectionNames) as Section[]

function normalizeSection(value: string | undefined): Section {
  return sections.includes(value as Section) ? value as Section : 'deployments'
}

function sectionFromPath(environment: Environment): Section {
  if (typeof window === 'undefined') return 'deployments'
  const prefix = `/provision/${environment}/`
  if (!window.location.pathname.startsWith(prefix)) return 'deployments'
  return normalizeSection(window.location.pathname.slice(prefix.length).split('/')[0])
}

function asText(row: Row | null | undefined, ...keys: string[]): string {
  if (!row) return '—'
  for (const key of keys) {
    const value = row[key]
    if (value !== null && value !== undefined && value !== '') return String(value)
  }
  return '—'
}

function money(value: unknown): string {
  const number = Number(value)
  if (!Number.isFinite(number)) return '$0.00'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number)
}

function dateValue(value: unknown): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return 'BL'
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}

function statusClass(value: unknown): string {
  const status = String(value ?? '').toLowerCase()
  if (['running', 'active', 'issued', 'succeeded'].includes(status)) return 'bg-[#d9f99d]'
  if (['provisioning', 'resizing', 'queued', 'running-operation'].includes(status)) return 'bg-[#fff0a6]'
  if (['error', 'failed', 'revoked', 'retired', 'stopped'].includes(status)) return 'bg-[#fecaca]'
  return 'bg-white'
}

function Status({ value }: { value: unknown }) {
  return (
    <span className={`${statusClass(value)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]`}>
      {String(value ?? 'unknown').replaceAll('_', ' ')}
    </span>
  )
}

function PageTitle({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-8 border-b-[3px] border-[#111] pb-7">
      <div className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#b63700]">{eyebrow}</div>
      <h1 className="mt-3 text-[34px] font-black leading-none tracking-[-0.04em] sm:text-[44px]">{title}</h1>
      {copy ? <p className="mt-4 max-w-3xl text-[14px] font-medium leading-6 text-[#666]">{copy}</p> : null}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border-2 border-dashed border-[#999] bg-white px-6 py-12 text-center text-[13px] font-semibold text-[#666]">{children}</div>
}

export function ProvisionConsole({
  environment,
  initialSection,
}: {
  environment: Environment
  initialSection: string
}) {
  const [section, setSection] = useState<Section>(() => normalizeSection(initialSection))
  const [me, setMe] = useState<Me | null>(null)
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deployments, setDeployments] = useState<Row[]>([])
  const [billing, setBilling] = useState<Row[]>([])
  const [billingTotals, setBillingTotals] = useState({ estimatedCharge: 0, normalizedUsage: 0 })
  const [billingAvailable, setBillingAvailable] = useState(true)
  const [billingNote, setBillingNote] = useState('')
  const [billingTrial, setBillingTrial] = useState<{ active: boolean; endsAt: string | null }>({ active: false, endsAt: null })
  const [licenses, setLicenses] = useState<Row[]>([])
  const [organizationInfo, setOrganizationInfo] = useState<{ organization: Row | null; tenants: Row[]; accountManager: Row | null; branding?: { source?: string; domain?: string | null; displayName?: string | null; logoUrl?: string | null } | null }>({ organization: null, tenants: [], accountManager: null, branding: null })
  const [claiming, setClaiming] = useState(false)
  const [claimToken, setClaimToken] = useState<string | null>(null)
  const [returnToPapyrus, setReturnToPapyrus] = useState<string | null>(null)
  const [organizationForm, setOrganizationForm] = useState({ legalName: '', displayName: '' })
  const [onboardingStep, setOnboardingStep] = useState<'identity' | 'organization' | 'agreements' | 'ready'>('identity')
  const [showReady, setShowReady] = useState(false)
  const [acceptingAll, setAcceptingAll] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [vmTab, setVmTab] = useState<'vms' | 'containers'>('vms')
  const [resizeDeployment, setResizeDeployment] = useState<Row | null>(null)
  const [sizes, setSizes] = useState<Array<{ name: string; vcpus: number; memoryMb: number; papyrusHourlyUsd: number }>>([])
  const [sizeLoading, setSizeLoading] = useState(false)
  const [selectedSize, setSelectedSize] = useState('')
  const [resizing, setResizing] = useState(false)

  const navigateSection = useCallback((next: Section) => {
    if (next === section) return
    const url = new URL(window.location.href)
    url.pathname = `/provision/${environment}/${next}`
    window.history.pushState({ provisionSection: next }, '', url)
    setSection(next)
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [environment, section])

  useEffect(() => {
    const onPopState = () => setSection(sectionFromPath(environment))
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [environment])

  const loadMe = useCallback(async () => {
    try {
      const result = await licenseFetch<Me>('/api/provision/private/me')
      if (result.environment !== environment) {
        setMe(null)
        toast.error('This Microsoft session belongs to the other provisioning environment.')
        return
      }
      setMe(result)
      if (!result.organization && result.tenantProfile) {
        const suggestedName = result.tenantProfile.displayName ?? ''
        setOrganizationForm((current) => ({
          legalName: current.legalName || suggestedName,
          displayName: current.displayName || suggestedName,
        }))
      }
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) {
        setMe(null)
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load provisioning account.')
      }
    } finally {
      setChecking(false)
    }
  }, [environment])

  const loadSection = useCallback(async () => {
    if (!me?.organization) return
    setLoading(true)
    try {
      if (section === 'deployments') {
        const result = await licenseFetch<{ items: Row[] }>('/api/provision/private/deployments')
        setDeployments(result.items)
      } else if (section === 'billing') {
        const result = await licenseFetch<{
          available: boolean
          items: Row[]
          totals: { estimatedCharge: number; normalizedUsage: number }
          trial: { active: boolean; endsAt: string | null }
          note?: string
        }>('/api/provision/private/billing')
        setBillingAvailable(result.available)
        setBilling(result.items)
        setBillingTotals(result.totals)
        setBillingTrial(result.trial)
        setBillingNote(result.note ?? '')
      } else if (section === 'licenses') {
        const result = await licenseFetch<{ items: Row[] }>('/api/provision/private/offline-licenses')
        setLicenses(result.items)
      } else if (section === 'organization') {
        setOrganizationInfo(await licenseFetch('/api/provision/private/organization'))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load provisioning data.')
    } finally {
      setLoading(false)
    }
  }, [me?.organization, section])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const claim = params.get('claim')
    if (claim) setClaimToken(claim)
    const provisionError = params.get('provisionError')
    if (provisionError) {
      setAuthError(provisionError)
      const url = new URL(window.location.href)
      url.searchParams.delete('provisionError')
      window.history.replaceState({}, '', url.toString())
    }
    void loadMe()
  }, [loadMe])

  useEffect(() => {
    if (me?.organization) void loadSection()
  }, [me?.organization, loadSection])

  useEffect(() => {
    if (!deployments.some((deployment) => String(deployment.status) === 'resizing')) return
    const timer = window.setInterval(() => {
      void licenseFetch<{ items: Row[] }>('/api/provision/private/deployments')
        .then((result) => setDeployments(result.items))
        .catch(() => undefined)
    }, 8_000)
    return () => window.clearInterval(timer)
  }, [deployments])

  const startSignIn = async () => {
    setSigningIn(true)
    try {
      const result = await licenseFetch<{ url: string }>(
        `/api/provision/auth/start?environment=${environment}&returnTo=${encodeURIComponent(window.location.href)}`,
      )
      window.location.assign(result.url)
    } catch (error) {
      setSigningIn(false)
      toast.error(error instanceof Error ? error.message : 'Unable to start Microsoft sign-in.')
    }
  }

  const signOut = async () => {
    try {
      await licenseFetch('/api/provision/logout', { method: 'POST', body: '{}' })
    } finally {
      setMe(null)
      setDeployments([])
      setBilling([])
      setLicenses([])
    }
  }

  const createOrganization = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!organizationForm.legalName.trim()) return
    try {
      await licenseFetch('/api/provision/private/organization', {
        method: 'POST',
        body: JSON.stringify({
          legalName: organizationForm.legalName.trim(),
          displayName: organizationForm.displayName.trim() || null,
        }),
      })
      toast.success('Organization connected to this Microsoft Entra tenant.')
      setOnboardingStep('agreements')
      await loadMe()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to connect organization.')
    }
  }

  const acceptAgreement = async (agreementType: string) => {
    try {
      await licenseFetch('/api/provision/private/agreements/accept', {
        method: 'POST',
        body: JSON.stringify({ agreementType }),
      })
      toast.success('Agreement acceptance recorded.')
      await loadMe()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to record agreement acceptance.')
    }
  }

  const acceptAllAgreements = async () => {
    if (!me) return
    const pending = me.agreements.filter((agreement) => !agreement.accepted)
    if (!pending.length) {
      setShowReady(true)
      setOnboardingStep('ready')
      return
    }
    setAcceptingAll(true)
    try {
      for (const agreement of pending) {
        await licenseFetch('/api/provision/private/agreements/accept', {
          method: 'POST',
          body: JSON.stringify({ agreementType: agreement.type }),
        })
      }
      toast.success(environment === 'government' ? 'Government deployment acknowledgments recorded.' : 'Commercial agreements accepted.')
      setShowReady(true)
      setOnboardingStep('ready')
      await loadMe()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to record agreement acceptance.')
    } finally {
      setAcceptingAll(false)
    }
  }

  const claimDeployment = async () => {
    if (!claimToken) return
    setClaiming(true)
    try {
      const result = await licenseFetch<{ deployment: Row }>('/api/provision/private/claim', {
        method: 'POST',
        body: JSON.stringify({ token: claimToken }),
      })
      toast.success(`${asText(result.deployment, 'azure_vm_size')} Papyrus deployment linked.`)
      if (result.deployment.public_origin) setReturnToPapyrus(String(result.deployment.public_origin))
      setClaimToken(null)
      const url = new URL(window.location.href)
      url.searchParams.delete('claim')
      window.history.replaceState({}, '', url.toString())
      const list = await licenseFetch<{ items: Row[] }>('/api/provision/private/deployments')
      setDeployments(list.items)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to link deployment.')
    } finally {
      setClaiming(false)
    }
  }

  useEffect(() => {
    if (claimToken && me?.organization && me.agreementsComplete && !claiming) void claimDeployment()
    // claimDeployment intentionally follows the current claim/session state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimToken, me?.organization, me?.agreementsComplete])

  const openResize = async (deployment: Row) => {
    setResizeDeployment(deployment)
    setSelectedSize('')
    setSizes([])
    setSizeLoading(true)
    try {
      const result = await licenseFetch<{ current: string; items: Array<{ name: string; vcpus: number; memoryMb: number; papyrusHourlyUsd: number }> }>(
        `/api/provision/private/deployments/${encodeURIComponent(String(deployment.id))}/sizes`,
      )
      setSizes(result.items.filter((size) => size.vcpus >= 2 && size.memoryMb >= 8192))
      setSelectedSize(result.current)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load Azure resize options.')
    } finally {
      setSizeLoading(false)
    }
  }

  const requestResize = async () => {
    if (!resizeDeployment || !selectedSize || selectedSize === resizeDeployment.azure_vm_size) return
    setResizing(true)
    try {
      await licenseFetch(`/api/provision/private/deployments/${encodeURIComponent(String(resizeDeployment.id))}/resize`, {
        method: 'POST',
        body: JSON.stringify({ vmSize: selectedSize }),
      })
      toast.success('Azure resize requested. Papyrus will restart when the size change completes.')
      setResizeDeployment(null)
      const result = await licenseFetch<{ items: Row[] }>('/api/provision/private/deployments')
      setDeployments(result.items)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) {
        toast.error('Reconnect Microsoft Azure before resizing this deployment.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to resize deployment.')
      }
    } finally {
      setResizing(false)
    }
  }

  const nav = useMemo(() => {
    if (!me) return []
    const items: Array<{ id: Section; label: string; icon: typeof Server; visible: boolean }> = [
      { id: 'deployments', label: 'Deployments', icon: Server, visible: true },
      { id: 'billing', label: 'Billing', icon: CircleDollarSign, visible: me.capabilities.marketplaceBilling },
      { id: 'licenses', label: 'Offline Licenses', icon: KeyRound, visible: me.capabilities.offlineLicenses || environment === 'government' },
      { id: 'organization', label: 'Organization', icon: Building2, visible: true },
      { id: 'agreements', label: 'Agreements', icon: FileCheck2, visible: true },
    ]
    return items.filter((item) => item.visible)
  }, [environment, me])

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf9]">
        <div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[11px] font-black uppercase tracking-[0.12em]">
          <Loader2 className="h-4 w-4 animate-spin" /> Opening Papyrus provisioning
        </div>
      </div>
    )
  }

  if (!me) {
    return (
      <main className="min-h-screen bg-[#fafaf9] px-6 py-14 lg:px-9">
        <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-[1180px] gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
          <section className="border-[3px] border-[#111] bg-[#111] p-8 text-white shadow-[8px_8px_0_#ff5f1f] lg:p-11">
            <span className="inline-flex border-2 border-white bg-[#ff5f1f] px-3 py-1 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#111]">
              Papyrus / {environment}
            </span>
            <h1 className="mt-8 max-w-[650px] text-[44px] font-black uppercase leading-[.94] tracking-[-.04em] sm:text-[60px]">
              Your deployment control plane.
            </h1>
            <p className="mt-6 max-w-[620px] text-[16px] font-medium leading-7 text-[#d0d0d0]">
              Connect the Microsoft account that owns your Papyrus environment. Manage deployments, review Marketplace usage, keep agreements together, and retrieve offline licenses when your environment requires them.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {[
                ['01', 'Verify Microsoft identity'],
                ['02', 'Connect your organization'],
                ['03', 'Manage Papyrus deployments'],
              ].map(([step, label]) => (
                <div key={step} className="border-2 border-white/40 p-4">
                  <div className="font-mono text-[10px] font-black text-[#ff5f1f]">{step}</div>
                  <div className="mt-2 text-[13px] font-bold">{label}</div>
                </div>
              ))}
            </div>
          </section>
          <section className="nb-panel p-8 lg:p-10">
            {authError === 'government_email_required' ? (
              <div className="mb-6 border-[3px] border-[#111] bg-[#fecaca] p-4 text-[12px] font-bold leading-5">
                Government provisioning requires a Microsoft Entra account whose email ends in <code>.gov</code> or <code>.mil</code>.
              </div>
            ) : null}
            <div className="flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f] shadow-[4px_4px_0_#111]">
              <ShieldCheck className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <div className="mt-8 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#b63700]">
              {environment === 'government' ? 'Government provisioning' : 'Commercial provisioning'}
            </div>
            <h2 className="mt-3 text-[30px] font-extrabold tracking-[-.04em]">Continue with Microsoft</h2>
            <p className="mt-4 text-[14px] font-medium leading-6 text-[#666]">
              Sign in with an organizational Microsoft Entra account. Azure management access is short-lived and used only for deployment verification and actions you explicitly request.
            </p>
            <button
              type="button"
              onClick={() => void startSignIn()}
              disabled={signingIn}
              className="nb-btn-orange mt-9 flex w-full items-center justify-center gap-3 px-5 py-4 font-mono text-[11px] font-black uppercase tracking-[0.12em] disabled:opacity-60"
            >
              {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Continue with Microsoft
            </button>
            <div className="mt-6 border-t-2 border-[#111] pt-5 text-[11px] font-medium leading-5 text-[#777]">
              {environment === 'government'
                ? 'Azure Government uses its own national-cloud identity and Resource Manager endpoints. A .gov or .mil Microsoft account is required.'
                : 'Microsoft Marketplace remains the billing system of record for usage-based deployments.'}
            </div>
          </section>
        </div>
      </main>
    )
  }

  const tenantLogo = me.tenantProfile?.logoUrl ?? null
  const tenantName = me.tenantProfile?.displayName || organizationForm.displayName || organizationForm.legalName || 'Your organization'
  const tenantDomain = me.tenantProfile?.primaryDomain ?? null
  const onboardingNeeded = !me.organization || !me.agreementsComplete || showReady

  if (onboardingNeeded) {
    const effectiveStep: 'identity' | 'organization' | 'agreements' | 'ready' =
      showReady ? 'ready'
        : me.organization && !me.agreementsComplete ? 'agreements'
          : onboardingStep

    const stepIndex = effectiveStep === 'identity' ? 0 : effectiveStep === 'organization' ? 1 : effectiveStep === 'agreements' ? 2 : 3
    const labels = ['Identity', 'Organization', 'Agreements', 'Ready']

    return (
      <main className="min-h-screen bg-[#fafaf9] px-6 py-12 lg:px-9">
        <div className="mx-auto max-w-[980px]">
          <div className="mb-8">
            <div className="font-mono text-[10px] font-black uppercase tracking-[.16em] text-[#b63700]">Papyrus / First connection</div>
            <h1 className="mt-3 text-[38px] font-black uppercase leading-[.95] tracking-[-.045em] sm:text-[52px]">Set up your control plane.</h1>
            <p className="mt-4 max-w-3xl text-[14px] font-medium leading-6 text-[#666]">Verify the Microsoft identity boundary, confirm the organization profile, accept the required terms, and then manage Papyrus from a persistent deployment portal.</p>
          </div>

          <div className="mb-8 grid grid-cols-4 border-[3px] border-[#111] bg-white">
            {labels.map((label, index) => (
              <div key={label} className={`border-r-[3px] border-[#111] p-3 last:border-r-0 ${index === stepIndex ? 'bg-[#ff5f1f]' : index < stepIndex ? 'bg-[#d9f99d]' : 'bg-white'}`}>
                <div className="font-mono text-[9px] font-black uppercase tracking-[.1em]">{String(index + 1).padStart(2, '0')}</div>
                <div className="mt-1 hidden text-[11px] font-extrabold sm:block">{label}</div>
              </div>
            ))}
          </div>

          {effectiveStep === 'identity' ? (
            <section className="nb-panel p-7 lg:p-9">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-16 w-16 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f] shadow-[4px_4px_0_#111]"><ShieldCheck className="h-8 w-8" /></div>
                <div>
                  <div className="font-mono text-[9px] font-black uppercase tracking-[.13em] text-[#777]">Microsoft identity verified</div>
                  <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.04em]">{me.user.name || me.user.email || 'Microsoft Entra user'}</h2>
                  <div className="mt-2 text-[12px] font-semibold text-[#666]">{me.user.email}</div>
                </div>
              </div>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="border-2 border-[#111] bg-[#fafaf9] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Tenant</div><code className="mt-2 block break-all text-[11px]">{me.user.tenantId}</code></div>
                <div className="border-2 border-[#111] bg-[#fafaf9] p-4"><div className="font-mono text-[9px] font-black uppercase text-[#777]">Boundary</div><div className="mt-2 text-[13px] font-extrabold">{environment === 'government' ? 'Government · .gov/.mil verified' : 'Commercial Azure'}</div></div>
              </div>
              <button type="button" onClick={() => setOnboardingStep('organization')} className="nb-btn-orange mt-7 inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase">Continue <ChevronRight className="h-4 w-4" /></button>
            </section>
          ) : null}

          {effectiveStep === 'organization' ? (
            <form onSubmit={createOrganization} className="nb-panel p-7 lg:p-9">
              <div className="flex flex-col gap-5 border-b-[3px] border-[#111] pb-6 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border-[3px] border-[#111] bg-white shadow-[4px_4px_0_#111]">
                  {tenantLogo ? <img src={tenantLogo} alt="" className="h-full w-full object-contain p-2" /> : <Building2 className="h-8 w-8" />}
                </div>
                <div>
                  <div className="font-mono text-[9px] font-black uppercase tracking-[.13em] text-[#777]">{me.tenantProfile?.logoSource === 'entra' ? 'Entra organization branding' : environment === 'government' ? 'Government domain branding' : 'Entra tenant'}</div>
                  <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.04em]">{tenantName}</h2>
                  {tenantDomain ? <div className="mt-2 font-mono text-[10px] font-bold text-[#666]">{tenantDomain}</div> : null}
                </div>
              </div>
              <div className="mt-7 grid gap-5">
                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[.12em]">Legal organization name</span>
                  <input className="nb-input w-full" value={organizationForm.legalName} onChange={(event) => setOrganizationForm({ ...organizationForm, legalName: event.target.value })} required />
                </label>
                <label className="block">
                  <span className="mb-2 block font-mono text-[10px] font-black uppercase tracking-[.12em]">Display name</span>
                  <input className="nb-input w-full" value={organizationForm.displayName} onChange={(event) => setOrganizationForm({ ...organizationForm, displayName: event.target.value })} />
                </label>
                {tenantDomain ? (
                  <div className="border-2 border-[#111] bg-[#fafaf9] p-4">
                    <div className="font-mono text-[9px] font-black uppercase tracking-[.1em] text-[#777]">{environment === 'government' ? 'Verified government email domain' : 'Primary verified Entra domain'}</div>
                    <div className="mt-2 font-mono text-[12px] font-bold">{tenantDomain}</div>
                  </div>
                ) : null}
              </div>
              <div className="mt-7 flex gap-3">
                <button type="button" onClick={() => setOnboardingStep('identity')} className="nb-btn-white px-5 py-3 font-mono text-[10px] font-black uppercase">Back</button>
                <button type="submit" className="nb-btn-orange inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase">Connect organization <ChevronRight className="h-4 w-4" /></button>
              </div>
            </form>
          ) : null}

          {effectiveStep === 'agreements' ? (
            <section className="nb-panel p-7 lg:p-9">
              <div className="font-mono text-[9px] font-black uppercase tracking-[.13em] text-[#777]">Required agreements</div>
              <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.04em]">{environment === 'government' ? 'Confirm the deployment boundary.' : 'Confirm the commercial terms.'}</h2>
              <div className="mt-6 space-y-4">
                {me.agreements.map((agreement) => (
                  <a key={agreement.type} href={agreement.href} target="_blank" rel="noreferrer" className={`flex items-start justify-between gap-5 border-[3px] border-[#111] p-5 ${agreement.accepted ? 'bg-[#d9f99d]' : 'bg-white'}`}>
                    <div><div className="text-[15px] font-extrabold">{agreement.title}</div><p className="mt-2 text-[12px] font-medium leading-5 text-[#666]">{agreement.summary}</p><div className="mt-3 font-mono text-[9px] font-black uppercase text-[#777]">Version {agreement.version}</div></div>
                    <ExternalLink className="h-4 w-4 shrink-0" />
                  </a>
                ))}
              </div>
              <button type="button" disabled={acceptingAll} onClick={() => void acceptAllAgreements()} className="nb-btn-orange mt-7 inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase disabled:opacity-50">{acceptingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} {environment === 'government' ? 'Acknowledge and continue' : 'Accept and continue'}</button>
            </section>
          ) : null}

          {effectiveStep === 'ready' ? (
            <section className="border-[3px] border-[#111] bg-[#d9f99d] p-7 shadow-[6px_6px_0_#111] lg:p-9">
              <div className="font-mono text-[9px] font-black uppercase tracking-[.13em]">Setup complete</div>
              <h2 className="mt-3 text-[32px] font-black tracking-[-.04em]">{asText(me.organization, 'display_name', 'legal_name')} is connected.</h2>
              <p className="mt-4 max-w-2xl text-[13px] font-semibold leading-6">Your tenant, agreements, Account Manager, deployment records, and {environment === 'government' ? 'offline licensing' : 'Marketplace billing'} now live in this control plane.</p>
              <button type="button" onClick={() => { setShowReady(false); setOnboardingStep('ready'); navigateSection('deployments') }} className="nb-btn-white mt-7 inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase">Open control plane <ChevronRight className="h-4 w-4" /></button>
            </section>
          ) : null}
        </div>
      </main>
    )
  }

  const manager = me.accountManager
  const managerName = asText(manager, 'display_name')
  const managerEmail = asText(manager, 'email')
  const bookingUrl = manager?.booking_url ? String(manager.booking_url) : null
  const managerTitle = asText(manager, 'title')
  const managerAvatar = manager?.avatar_url ? String(manager.avatar_url) : null

  return (
    <div className="min-h-screen bg-[#fafaf9] text-[#111] lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="flex border-b-[3px] border-[#111] bg-white lg:sticky lg:top-0 lg:h-screen lg:flex-col lg:border-b-0 lg:border-r-[3px]">
        <div className="flex w-full flex-col">
          <div className="border-b-[3px] border-[#111] px-5 py-5">
            <a href="/" className="font-[family-name:var(--font-display)] text-[25px] font-black uppercase tracking-[-.04em]">Beag Labs</a>
            <div className="mt-2 font-mono text-[9px] font-black uppercase tracking-[.15em] text-[#b63700]">Papyrus control plane</div>
          </div>
          <nav className="grid grid-cols-2 p-3 sm:grid-cols-3 lg:block lg:space-y-1">
            {nav.map(({ id, label, icon: Icon }) => {
              const active = id === section
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => navigateSection(id)}
                  aria-current={active ? 'page' : undefined}
                  className={`flex w-full items-center gap-3 border-2 px-3 py-3 text-left text-[12px] font-extrabold ${active ? 'border-[#111] bg-[#ff5f1f] shadow-[3px_3px_0_#111]' : 'border-transparent hover:border-[#111] hover:bg-[#fff3e6]'}`}
                >
                  <Icon className="h-4 w-4" strokeWidth={2.5} /> {label}
                </button>
              )
            })}
          </nav>
        </div>

        <div className="ml-auto flex items-center gap-3 border-l-[3px] border-[#111] p-3 lg:mt-auto lg:ml-0 lg:block lg:border-l-0 lg:border-t-[3px] lg:p-4">
          {manager ? (
            <div className="border-[3px] border-[#111] bg-[#fafaf9] p-4 shadow-[4px_4px_0_#111]">
              <div className="font-mono text-[8px] font-black uppercase tracking-[.14em] text-[#777]">Account manager</div>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-none border-2 border-[#111] bg-[#ff5f1f]">
                  {managerAvatar ? <AvatarImage src={managerAvatar} alt="" className="rounded-none object-cover" /> : null}
                  <AvatarFallback className="rounded-none bg-[#ff5f1f] font-mono text-[11px] font-black">{initials(managerName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-extrabold">{managerName}</div>
                  {managerTitle !== '—' ? <div className="truncate text-[10px] font-medium text-[#777]">{managerTitle}</div> : null}
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t-2 border-[#111] pt-3">
                {managerEmail !== '—' ? <a className="block truncate text-[10px] font-bold underline underline-offset-2" href={`mailto:${managerEmail}`}>{managerEmail}</a> : null}
                {bookingUrl ? <a className="inline-flex items-center gap-1 text-[10px] font-black uppercase underline underline-offset-3" href={bookingUrl} target="_blank" rel="noreferrer"><CalendarDays className="h-3 w-3" /> Book time</a> : null}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-[#999] p-3 text-[10px] font-semibold text-[#777]">Account manager assignment pending.</div>
          )}
          <button type="button" onClick={() => void signOut()} className="mt-3 hidden w-full items-center justify-center gap-2 border-2 border-[#111] bg-white px-3 py-2 font-mono text-[9px] font-black uppercase lg:flex">
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1220px]">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="font-mono text-[9px] font-black uppercase tracking-[.14em] text-[#777]">{environment} / {sectionNames[section]}</div>
              <div className="mt-1 text-[14px] font-extrabold">{asText(me.organization, 'display_name', 'legal_name')}</div>
            </div>
            <div className="flex items-center gap-3">
              {!me.capabilities.azureManagementConnected ? (
                <button type="button" onClick={() => void startSignIn()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase">
                  Reconnect Azure
                </button>
              ) : null}
              <button type="button" onClick={() => void loadSection()} disabled={loading} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase disabled:opacity-50">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>
          </div>

          {returnToPapyrus ? (
            <div className="mb-8 flex flex-col justify-between gap-4 border-[3px] border-[#111] bg-[#d9f99d] p-5 shadow-[5px_5px_0_#111] sm:flex-row sm:items-center">
              <div>
                <div className="font-mono text-[9px] font-black uppercase tracking-[.12em]">Deployment connected</div>
                <div className="mt-1 text-[15px] font-extrabold">Return to the Papyrus appliance to finish customer Entra ID setup.</div>
              </div>
              <a href={returnToPapyrus} className="nb-btn-white inline-flex shrink-0 items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase">
                Return to Papyrus <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : null}

          {!me.agreementsComplete ? (
            <div className="mb-8 flex flex-col justify-between gap-4 border-[3px] border-[#111] bg-[#fff0a6] p-5 shadow-[5px_5px_0_#111] sm:flex-row sm:items-center">
              <div>
                <div className="font-mono text-[9px] font-black uppercase tracking-[.12em]">Action required</div>
                <div className="mt-1 text-[15px] font-extrabold">Review the required {environment} agreements before linking a new deployment.</div>
              </div>
              <button type="button" onClick={() => navigateSection('agreements')} className="nb-btn-white inline-flex shrink-0 items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase">Review agreements <ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          ) : null}

          {claimToken && !me.agreementsComplete ? (
            <div className="mb-8 border-[3px] border-[#111] bg-white p-5">
              <div className="font-mono text-[9px] font-black uppercase tracking-[.12em] text-[#b63700]">Deployment waiting</div>
              <p className="mt-2 text-[13px] font-medium leading-6">Your Papyrus VM is ready to be linked. Complete the required agreements and the portal will verify the VM against Azure automatically.</p>
            </div>
          ) : null}

          {section === 'deployments' ? (
            <>
              <PageTitle eyebrow="Papyrus infrastructure" title="Deployments" copy="Manage customer-hosted Papyrus appliances connected to this organization. Azure remains the infrastructure authority and Microsoft Marketplace remains the billing authority." />
              <div className="mb-6 flex w-fit border-[3px] border-[#111] bg-white">
                <button type="button" onClick={() => setVmTab('vms')} className={`flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase ${vmTab === 'vms' ? 'bg-[#ff5f1f]' : ''}`}><Server className="h-4 w-4" /> VMs</button>
                <button type="button" onClick={() => setVmTab('containers')} className={`flex items-center gap-2 border-l-[3px] border-[#111] px-5 py-3 font-mono text-[10px] font-black uppercase ${vmTab === 'containers' ? 'bg-[#ff5f1f]' : ''}`}><Container className="h-4 w-4" /> Containers <span className="text-[8px] text-[#777]">later</span></button>
              </div>
              {vmTab === 'containers' ? (
                <Empty>Container deployments are intentionally not enabled yet. The control plane is ready to add this tab when Papyrus has a supported Kubernetes distribution.</Empty>
              ) : deployments.length ? (
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <article key={String(deployment.id)} className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]">
                      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h2 className="truncate text-[19px] font-extrabold">{asText(deployment, 'vm_name', 'papyrus_deployment_id')}</h2>
                            <Status value={deployment.status} />
                          </div>
                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[9px] font-bold uppercase tracking-[.08em] text-[#666]">
                            <span>{asText(deployment, 'azure_region')}</span>
                            <span>{asText(deployment, 'azure_vm_size')}</span>
                            <span>{asText(deployment, 'vcpu_count')} vCPU</span>
                            <span>{asText(deployment, 'marketplace_plan')}</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="border-2 border-[#111] bg-[#fafaf9] px-4 py-2 text-right">
                            <div className="font-mono text-[8px] font-black uppercase text-[#777]">Papyrus software</div>
                            <div className="text-[15px] font-extrabold">{money(deployment.papyrus_hourly_usd)}/hr</div>
                          </div>
                          <button type="button" onClick={() => void openResize(deployment)} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-3 font-mono text-[9px] font-black uppercase">
                            <Cpu className="h-4 w-4" /> Resize
                          </button>
                          {deployment.public_origin ? <a href={String(deployment.public_origin)} target="_blank" rel="noreferrer" className="nb-btn-white inline-flex items-center gap-2 px-4 py-3 font-mono text-[9px] font-black uppercase">Open Papyrus <ExternalLink className="h-3.5 w-3.5" /></a> : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty>No VMs are linked yet. Deploy Papyrus from Azure Marketplace and use the provisioning link presented by the appliance on first run.</Empty>
              )}
            </>
          ) : null}

          {section === 'billing' ? (
            <>
              <PageTitle eyebrow="Microsoft Marketplace" title="Billing" copy="A Papyrus-specific view of Marketplace usage and estimated software charges. Microsoft remains the billing and invoice system of record." />
              {billingTrial.active ? (
                <div className="mb-7 border-[3px] border-[#111] bg-[#d9f99d] p-5 shadow-[4px_4px_0_#111]">
                  <div className="font-mono text-[9px] font-black uppercase tracking-[.12em]">Free trial active</div>
                  <div className="mt-2 text-[22px] font-black">Papyrus software is free through {dateValue(billingTrial.endsAt)}.</div>
                  <p className="mt-2 text-[12px] font-semibold leading-5">The Marketplace VM&apos;s Azure infrastructure is still billed separately by Microsoft. When the trial expires, the Marketplace plan converts to its normal paid rate unless the customer cancels.</p>
                </div>
              ) : null}
              {!billingAvailable ? (
                <div className="mb-7 border-[3px] border-[#111] bg-[#fff0a6] p-5 text-[12px] font-semibold leading-5">
                  Marketplace billing data is temporarily unavailable. The rest of the provisioning control plane remains usable.
                </div>
              ) : null}
              <div className="mb-7 grid gap-4 sm:grid-cols-2">
                <div className="border-[3px] border-[#111] bg-[#ff5f1f] p-5 shadow-[4px_4px_0_#111]"><div className="font-mono text-[9px] font-black uppercase tracking-[.12em]">{billingTrial.active ? 'Papyrus software charges during trial' : 'Mirrored estimated charges'}</div><div className="mt-2 text-[30px] font-black">{money(billingTotals.estimatedCharge)}</div></div>
                <div className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]"><div className="font-mono text-[9px] font-black uppercase tracking-[.12em]">Observed usage</div><div className="mt-2 text-[30px] font-black">{billingTotals.normalizedUsage.toLocaleString()}</div></div>
              </div>
              {billing.length ? (
                <div className="overflow-x-auto border-[3px] border-[#111] bg-white">
                  <table className="w-full min-w-[860px] text-left">
                    <thead className="border-b-[3px] border-[#111] bg-[#111] text-white"><tr>{['Period','Plan','VM','Billing','Usage','Estimated charge'].map((label) => <th key={label} className="px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[.1em]">{label}</th>)}</tr></thead>
                    <tbody>{billing.map((row, index) => <tr key={index} className="border-b-2 border-[#111] last:border-b-0"><td className="px-4 py-3 text-[12px] font-bold">{dateValue(row.usage_date)}</td><td className="px-4 py-3 text-[12px]">{asText(row,'sku')}</td><td className="px-4 py-3 text-[12px]">{asText(row,'vm_size')}</td><td className="px-4 py-3 text-[11px] font-bold">{row.trial_end_date && Date.parse(String(row.trial_end_date)) > Date.now() ? `Free trial → ${dateValue(row.trial_end_date)}` : asText(row,'sku_billing_type','marketplace_license_type')}</td><td className="px-4 py-3 text-[12px]">{asText(row,'normalized_usage')}</td><td className="px-4 py-3 text-[12px] font-extrabold">{money(row.estimated_charge)}</td></tr>)}</tbody>
                  </table>
                </div>
              ) : billingAvailable ? <Empty>No Marketplace billing observations are available yet. Partner Center usage reporting can lag behind the VM deployment.</Empty> : null}
              {billingNote ? <p className="mt-5 text-[11px] font-medium leading-5 text-[#777]">{billingNote}</p> : null}
            </>
          ) : null}

          {section === 'licenses' ? (
            <>
              <PageTitle eyebrow="Portable entitlement" title="Offline Licenses" copy="Signed Papyrus licenses for direct, restricted, disconnected, and government environments. License verification occurs locally inside the appliance." />
              {licenses.length ? (
                <div className="space-y-4">
                  {licenses.map((license) => (
                    <article key={String(license.id)} className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0_#111]">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-3"><h2 className="font-mono text-[13px] font-black">{asText(license,'license_id')}</h2><Status value={license.status} /></div>
                          <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-[#666]"><span>{asText(license,'scope')} scope</span><span>{asText(license,'name','sku')}</span><span>Expires {dateValue(license.expires_at)}</span></div>
                        </div>
                        <a
                          href={`${LICENSE_CONTROL_PLANE_ORIGIN}/api/provision/private/offline-licenses/${encodeURIComponent(String(license.id))}/download`}
                          className="nb-btn-white inline-flex items-center justify-center gap-2 px-4 py-3 font-mono text-[9px] font-black uppercase"
                        >
                          <KeyRound className="h-4 w-4" /> Download license
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <Empty>No offline license has been issued to this organization yet.</Empty>}
              {environment === 'government' ? <div className="mt-7 border-[3px] border-[#111] bg-[#fff0a6] p-5 text-[12px] font-medium leading-6"><strong>Disconnected workflow:</strong> licenses downloaded here can be transferred into approved disconnected environments. A website connection is not required for local license verification after import.</div> : null}
            </>
          ) : null}

          {section === 'organization' ? (
            <>
              <PageTitle eyebrow="Customer identity" title="Organization" copy="The organization and verified Entra tenant that own these provisioning records." />
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="border-[3px] border-[#111] bg-white p-6 shadow-[4px_4px_0_#111]">
                  <div className="font-mono text-[9px] font-black uppercase tracking-[.12em] text-[#777]">Organization</div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border-[3px] border-[#111] bg-white">
                      {(organizationInfo.branding?.logoUrl || me.tenantProfile?.logoUrl) ? <img src={String(organizationInfo.branding?.logoUrl || me.tenantProfile?.logoUrl)} alt="" className="h-full w-full object-contain p-2" /> : <Building2 className="h-7 w-7" />}
                    </div>
                    <div><div className="text-[24px] font-extrabold">{asText(me.organization,'display_name','legal_name')}</div>{asText(me.organization,'domain') !== '—' ? <div className="mt-1 font-mono text-[10px] font-bold text-[#666]">{asText(me.organization,'domain')}</div> : null}</div>
                  </div>
                  <div className="mt-5 border-t-2 border-[#111] pt-4 text-[12px] font-medium text-[#666]">Type: {asText(me.organization,'organization_type')} · Logo source: {organizationInfo.branding?.source || me.tenantProfile?.logoSource || 'none'}</div>
                </div>
                <div className="border-[3px] border-[#111] bg-white p-6 shadow-[4px_4px_0_#111]">
                  <div className="font-mono text-[9px] font-black uppercase tracking-[.12em] text-[#777]">Verified tenant</div>
                  <code className="mt-3 block break-all text-[13px] font-bold">{me.user.tenantId}</code>
                  <div className="mt-5 border-t-2 border-[#111] pt-4 text-[12px] font-medium text-[#666]">{environment === 'government' ? 'Azure Government identity boundary' : 'Azure commercial identity boundary'}</div>
                </div>
              </div>
            </>
          ) : null}

          {section === 'agreements' ? (
            <>
              <PageTitle eyebrow="Legal + deployment boundary" title="Agreements" copy={environment === 'government' ? 'Government acknowledgments supplement the controlling contract, task order, purchase order, OTA, or license; they do not supersede it.' : 'Accept the current commercial terms and privacy policy for this organization.'} />
              <div className="space-y-5">
                {me.agreements.map((agreement) => (
                  <article key={agreement.type} className={`border-[3px] border-[#111] p-6 shadow-[4px_4px_0_#111] ${agreement.accepted ? 'bg-[#d9f99d]' : 'bg-white'}`}>
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
                      <div className="max-w-3xl">
                        <div className="flex items-center gap-3"><h2 className="text-[20px] font-extrabold">{agreement.title}</h2>{agreement.accepted ? <span className="flex h-7 w-7 items-center justify-center border-2 border-[#111] bg-white"><Check className="h-4 w-4" strokeWidth={3} /></span> : null}</div>
                        <p className="mt-3 text-[13px] font-medium leading-6 text-[#666]">{agreement.summary}</p>
                        <div className="mt-3 font-mono text-[9px] font-black uppercase tracking-[.1em] text-[#777]">Version {agreement.version}</div>
                      </div>
                      <div className="flex shrink-0 flex-wrap gap-3">
                        <a href={agreement.href} target="_blank" rel="noreferrer" className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase">Read <ExternalLink className="h-3.5 w-3.5" /></a>
                        {!agreement.accepted ? <button type="button" onClick={() => void acceptAgreement(agreement.type)} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase">I accept <Check className="h-3.5 w-3.5" /></button> : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <div className="mt-7 border-[3px] border-[#111] bg-[#111] p-5 text-[12px] font-medium leading-6 text-white">
                {environment === 'government'
                  ? 'By acknowledging these deployment terms, you confirm you are authorized to operate this deployment. The governing contract or other controlling agreement prevails in the event of a conflict.'
                  : 'By accepting, you represent that you are authorized to accept these terms on behalf of your organization.'}
              </div>
            </>
          ) : null}
        </div>
      </main>

      <Dialog open={Boolean(resizeDeployment)} onOpenChange={(open) => { if (!open && !resizing) setResizeDeployment(null) }}>
        <DialogContent className="max-w-[640px] border-[3px] border-[#111] bg-white shadow-[8px_8px_0_#111]">
          <DialogHeader>
            <DialogTitle className="text-[25px] font-extrabold">Resize Papyrus VM</DialogTitle>
            <DialogDescription className="text-[13px] leading-6 text-[#666]">Azure may deallocate and restart the VM. Papyrus state remains on the attached data disk. Microsoft bills Azure infrastructure separately.</DialogDescription>
          </DialogHeader>
          {sizeLoading ? <div className="flex items-center gap-2 py-8 font-mono text-[10px] font-black uppercase"><Loader2 className="h-4 w-4 animate-spin" /> Reading Azure resize options</div> : (
            <div className="space-y-4 py-2">
              <label className="block">
                <span className="mb-2 block font-mono text-[9px] font-black uppercase tracking-[.12em]">VM size</span>
                <select className="nb-input w-full" value={selectedSize} onChange={(event) => setSelectedSize(event.target.value)}>
                  {sizes.map((size) => <option key={size.name} value={size.name}>{size.name} — {size.vcpus} vCPU / {(size.memoryMb / 1024).toFixed(0)} GiB — {money(size.papyrusHourlyUsd)}/hr Papyrus</option>)}
                </select>
              </label>
              {(() => {
                const target = sizes.find((size) => size.name === selectedSize)
                if (!target) return null
                return <div className="border-2 border-[#111] bg-[#fafaf9] p-4 text-[12px] leading-6"><strong>{target.vcpus} vCPU / {(target.memoryMb / 1024).toFixed(0)} GiB</strong><br />Papyrus software rate: <strong>{money(target.papyrusHourlyUsd)}/hour</strong>. Azure infrastructure charges are separate.</div>
              })()}
            </div>
          )}
          <DialogFooter>
            <button type="button" disabled={resizing} onClick={() => setResizeDeployment(null)} className="nb-btn-white px-4 py-2.5 font-mono text-[9px] font-black uppercase">Cancel</button>
            <button type="button" disabled={resizing || sizeLoading || !selectedSize || selectedSize === resizeDeployment?.azure_vm_size} onClick={() => void requestResize()} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase disabled:opacity-50">{resizing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />} Resize VM</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
