"use client"

import {
  CalendarClock,
  Copy,
  Download,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  MoreHorizontal,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LicenseControlPlaneError,
  licenseFetch,
  licensingCallbackUrl,
} from '@/lib/license-control-plane'

type Admin = { oid: string; tenantId: string; email?: string; name?: string }
type Row = Record<string, unknown>

function text(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function initials(value: string): string {
  const parts = value.trim().split(/s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'BL'
}

function date(value: unknown): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(parsed)
}

function short(value: unknown, length = 13): string {
  const raw = String(value ?? '')
  if (!raw) return '—'
  return raw.length <= length ? raw : `${raw.slice(0, length)}…`
}

function downloadDocument(document: unknown, name: string) {
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = window.document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

export function ProvisionedAccountsTable() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [loading, setLoading] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [rows, setRows] = useState<Row[]>([])
  const [mintingOrg, setMintingOrg] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await licenseFetch<{ items: Row[] }>('/api/v1/provisioned-accounts')
      setRows(result.items)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) setAdmin(null)
      else toast.error(error instanceof Error ? error.message : 'Unable to load provisioned accounts.')
    } finally {
      setLoading(false)
    }
  }, [])

  const checkSession = useCallback(async () => {
    setChecking(true)
    try {
      const result = await licenseFetch<{ admin: Admin }>('/api/v1/me')
      setAdmin(result.admin)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) setAdmin(null)
      else toast.error(error instanceof Error ? error.message : 'Unable to verify administrator session.')
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => { void checkSession() }, [checkSession])
  useEffect(() => { if (admin) void load() }, [admin, load])

  const startSignIn = async () => {
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
    try { await licenseFetch('/api/auth/sign-out', { method: 'POST', body: '{}' }) } catch { /* session may already be gone */ }
    setAdmin(null)
    setRows([])
  }

  const mintOfflineLicense = async (row: Row) => {
    const organizationId = text(row, 'organization_id')
    const organizationName = text(row, 'organization_display_name', 'legal_name')
    if (!window.confirm(`Mint a $250,000 90-day offline Papyrus license for ${organizationName}? This creates a booked commercial record, a 90-day disconnected entitlement, and a signed organization license.`)) return

    setMintingOrg(organizationId)
    try {
      const result = await licenseFetch<{ licenseId: string; expiresAt: string; document: Record<string, unknown> }>(
        `/api/v1/provisioned-accounts/${encodeURIComponent(organizationId)}/offline-license`,
        { method: 'POST', body: '{}' },
      )
      toast.success(`90-day offline license minted. Expires ${date(result.expiresAt)}.`)
      downloadDocument(result.document, `${result.licenseId}.papyrus-license.json`)
      await load()
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 409) {
        const payload = error.payload && typeof error.payload === 'object' ? error.payload as Record<string, unknown> : null
        if (payload?.error === 'active_offline_license_exists') {
          toast.error('This organization already has an active 90-day offline license.')
          return
        }
      }
      toast.error(error instanceof Error ? error.message : 'Unable to mint offline license.')
    } finally {
      setMintingOrg(null)
    }
  }

  const downloadActiveLicense = async (row: Row) => {
    const organizationId = text(row, 'organization_id')
    try {
      const result = await licenseFetch<{ license: Row | null }>(
        `/api/v1/provisioned-accounts/${encodeURIComponent(organizationId)}/offline-license`,
      )
      if (!result.license) throw new Error('No offline license is available.')
      const raw = result.license.signed_document_json
      const document = typeof raw === 'string' ? JSON.parse(raw) : raw
      downloadDocument(document, `${text(result.license, 'license_id')}.papyrus-license.json`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to download offline license.')
    }
  }

  const accountCount = rows.length
  const governmentCount = useMemo(() => rows.filter((row) => row.environment === 'government').length, [rows])

  if (checking) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-[720px] border-[3px] border-[#111] bg-white p-8 shadow-[6px_6px_0_#111]">
        <div className="font-mono text-[10px] font-black uppercase tracking-[.14em] text-[#b63700]">Private administration</div>
        <h2 className="mt-3 text-[30px] font-black tracking-[-.04em]">Provisioned accounts.</h2>
        <p className="mt-4 text-[14px] font-medium leading-6 text-[#666]">Sign in with an authorized Beag Labs Microsoft Entra account. This console now reflects customers who actually completed the Papyrus provisioning path.</p>
        <button type="button" onClick={() => void startSignIn()} disabled={signingIn} className="nb-btn-orange mt-7 inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase disabled:opacity-50">
          {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Continue with Microsoft
        </button>
      </div>
    )
  }

  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <span className="border-2 border-[#111] bg-white px-3 py-2 font-mono text-[9px] font-black uppercase">{accountCount} onboarded</span>
          <span className="border-2 border-[#111] bg-[#fff0a6] px-3 py-2 font-mono text-[9px] font-black uppercase">{governmentCount} government</span>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => void load()} disabled={loading} className="nb-btn-white inline-flex items-center gap-2 px-3 py-2 font-mono text-[9px] font-black uppercase disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
          <button type="button" onClick={() => void signOut()} className="nb-btn-white inline-flex items-center gap-2 px-3 py-2 font-mono text-[9px] font-black uppercase"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
        </div>
      </div>

      <div className="overflow-x-auto border-[3px] border-[#111] bg-white shadow-[5px_5px_0_#111]">
        <table className="w-full min-w-[1080px] border-collapse text-left">
          <thead className="bg-[#111] text-white">
            <tr>
              {['Organization', 'Person', 'Environment', 'Tenant', 'Deployments', 'Account Manager', 'Last seen', ''].map((label) => (
                <th key={label} className="px-4 py-3 font-mono text-[9px] font-black uppercase tracking-[.11em]">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const organizationName = text(row, 'organization_display_name', 'legal_name')
              const government = row.environment === 'government'
              const activeLicense = Boolean(row.active_license_id) && (!row.active_license_expires_at || Date.parse(String(row.active_license_expires_at)) > Date.now())
              const busy = mintingOrg === String(row.organization_id)
              return (
                <tr key={`${String(row.organization_id)}:${String(row.oid)}:${String(row.environment)}`} className="border-t-2 border-[#111] align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 rounded-none border-2 border-[#111] bg-[#fafaf9]">
                        {row.logo_url ? <AvatarImage src={String(row.logo_url)} alt="" className="rounded-none object-contain p-1" /> : null}
                        <AvatarFallback className="rounded-none bg-[#ff5f1f] font-mono text-[10px] font-black">{initials(organizationName)}</AvatarFallback>
                      </Avatar>
                      <div><div className="text-[12px] font-extrabold">{organizationName}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{text(row, 'domain', 'primary_domain')}</div></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><div className="text-[12px] font-bold">{text(row, 'display_name')}</div><div className="mt-1 text-[10px] text-[#777]">{text(row, 'email')}</div></td>
                  <td className="px-4 py-3"><span className={`inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase ${government ? 'bg-[#fff0a6]' : 'bg-[#d9f99d]'}`}>{text(row, 'environment')}</span>{activeLicense ? <div className="mt-2 font-mono text-[8px] font-black uppercase text-[#777]">Offline until {date(row.active_license_expires_at)}</div> : null}</td>
                  <td className="px-4 py-3 font-mono text-[10px]" title={text(row, 'tenant_id')}>{short(row.tenant_id)}</td>
                  <td className="px-4 py-3 text-[12px] font-extrabold">{Number(row.deployment_count ?? 0)}</td>
                  <td className="px-4 py-3"><div className="text-[11px] font-bold">{text(row, 'account_manager_name')}</div><div className="mt-1 text-[9px] text-[#777]">{text(row, 'account_manager_email')}</div></td>
                  <td className="px-4 py-3 text-[11px] font-semibold">{date(row.last_seen_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" className="inline-flex h-9 w-9 items-center justify-center border-2 border-[#111] bg-white hover:bg-[#ff5f1f]" aria-label={`Actions for ${organizationName}`}>
                          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-none border-2 border-[#111] bg-white shadow-[3px_3px_0_#111]">
                        <DropdownMenuLabel className="font-mono text-[9px] font-black uppercase">{organizationName}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-[#111]" />
                        <DropdownMenuItem onSelect={() => void navigator.clipboard.writeText(text(row, 'tenant_id')).then(() => toast.success('Tenant ID copied.'))} className="rounded-none text-[11px] font-bold"><Copy className="h-3.5 w-3.5" /> Copy tenant ID</DropdownMenuItem>
                        {activeLicense ? <DropdownMenuItem onSelect={() => void downloadActiveLicense(row)} className="rounded-none text-[11px] font-bold"><Download className="h-3.5 w-3.5" /> Download active offline license</DropdownMenuItem> : null}
                        {government && !activeLicense ? (
                          <>
                            <DropdownMenuSeparator className="bg-[#111]" />
                            <DropdownMenuItem disabled={busy} onSelect={() => void mintOfflineLicense(row)} className="rounded-none bg-[#ff5f1f] text-[11px] font-black focus:bg-[#ff5f1f]"><KeyRound className="h-3.5 w-3.5" /> Mint 90-day offline license · $250K</DropdownMenuItem>
                          </>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!rows.length ? <div className="border-t-2 border-[#111] p-10 text-center"><ShieldCheck className="mx-auto h-6 w-6" /><div className="mt-3 text-[14px] font-extrabold">No provisioned accounts yet.</div><p className="mt-2 text-[11px] font-medium text-[#777]">Rows appear after a customer signs in through /provision/commercial or /provision/government and connects an organization.</p></div> : null}
      </div>

      <div className="mt-5 flex items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[.08em] text-[#777]">
        <CalendarClock className="h-3.5 w-3.5" />
        The $250,000 SKU is now the 90-day offline/disconnected license. Connected Marketplace deployments remain usage-billed.
      </div>
    </section>
  )
}
