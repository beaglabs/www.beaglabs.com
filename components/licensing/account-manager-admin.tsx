"use client"

import { CalendarDays, CheckCircle2, Loader2, LogIn, RefreshCw, Save, UserPlus } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LicenseControlPlaneError, licenseFetch, licensingCallbackUrl } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Admin = { oid: string; tenantId: string; email?: string; name?: string }

function text(row: Row | null | undefined, ...keys: string[]): string {
  if (!row) return '—'
  for (const key of keys) {
    const value = row[key]
    if (value !== null && value !== undefined && value !== '') return String(value)
  }
  return '—'
}

function initials(value: string): string {
  const parts = value.split(/\s+/).filter(Boolean)
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'BL'
}

export function AccountManagerAdmin() {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [checking, setChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [managers, setManagers] = useState<Row[]>([])
  const [organizations, setOrganizations] = useState<Row[]>([])
  const [assignments, setAssignments] = useState<Row[]>([])
  const [selected, setSelected] = useState<Record<string, string>>({})
  const [editing, setEditing] = useState<Record<string, { title: string; bookingUrl: string; avatarUrl: string }>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [managerResult, orgResult, assignmentResult] = await Promise.all([
        licenseFetch<{ items: Row[] }>('/api/v1/account-managers'),
        licenseFetch<{ items: Row[] }>('/api/v1/organizations?limit=500'),
        licenseFetch<{ items: Row[] }>('/api/v1/account-manager-assignments'),
      ])
      setManagers(managerResult.items)
      setOrganizations(orgResult.items)
      setAssignments(assignmentResult.items)
      setSelected(Object.fromEntries(assignmentResult.items.filter((item) => item.role === 'primary').map((item) => [String(item.organization_id), String(item.account_manager_id)])))
      setEditing(Object.fromEntries(managerResult.items.map((manager) => [
        String(manager.id),
        {
          title: manager.title ? String(manager.title) : '',
          bookingUrl: manager.booking_url ? String(manager.booking_url) : '',
          avatarUrl: manager.avatar_url ? String(manager.avatar_url) : '',
        },
      ])))
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) setAdmin(null)
      else toast.error(error instanceof Error ? error.message : 'Unable to load account managers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void licenseFetch<{ admin: Admin }>('/api/v1/me')
      .then((result) => setAdmin(result.admin))
      .catch(() => setAdmin(null))
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    if (admin) void load()
  }, [admin, load])

  const signIn = async () => {
    setSigningIn(true)
    try {
      const result = await licenseFetch<{ url?: string }>('/api/auth/sign-in/social', {
        method: 'POST',
        body: JSON.stringify({
          provider: 'microsoft',
          callbackURL: licensingCallbackUrl('/licensing/account-managers'),
          errorCallbackURL: licensingCallbackUrl('/licensing/account-managers?auth=error'),
        }),
      })
      if (!result.url) throw new Error('Microsoft sign-in did not return an authorization URL.')
      window.location.assign(result.url)
    } catch (error) {
      setSigningIn(false)
      toast.error(error instanceof Error ? error.message : 'Unable to start Microsoft sign-in.')
    }
  }

  const syncMe = async () => {
    try {
      await licenseFetch('/api/v1/account-managers/sync-me', { method: 'POST', body: '{}' })
      toast.success('Your Entra identity is available as an account manager.')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to sync account manager.')
    }
  }

  const saveManager = async (manager: Row) => {
    const form = editing[String(manager.id)]
    if (!form) return
    try {
      await licenseFetch(`/api/v1/account-managers/${encodeURIComponent(String(manager.id))}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title.trim() || null,
          bookingUrl: form.bookingUrl.trim() || null,
          avatarUrl: form.avatarUrl.trim() || null,
        }),
      })
      toast.success('Account manager profile updated.')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update account manager.')
    }
  }

  const assign = async (organizationId: string, accountManagerId: string) => {
    try {
      await licenseFetch(`/api/v1/organizations/${encodeURIComponent(organizationId)}/account-manager`, {
        method: 'PUT',
        body: JSON.stringify({ accountManagerId: accountManagerId || null }),
      })
      setSelected((current) => ({ ...current, [organizationId]: accountManagerId }))
      toast.success(accountManagerId ? 'Account manager assigned.' : 'Account manager removed.')
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to assign account manager.')
    }
  }

  const activeManagers = useMemo(() => managers.filter((manager) => Number(manager.active) === 1), [managers])

  if (checking) {
    return <div className="flex min-h-[480px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-6 py-4 font-mono text-[10px] font-black uppercase"><Loader2 className="h-4 w-4 animate-spin" /> Checking Entra session</div></div>
  }

  if (!admin) {
    return (
      <div className="mx-auto max-w-[720px]">
        <div className="nb-panel p-8">
          <div className="flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f] shadow-[4px_4px_0_#111]"><UserPlus className="h-6 w-6" /></div>
          <h2 className="mt-7 text-[30px] font-extrabold tracking-[-.04em]">Account manager administration</h2>
          <p className="mt-4 text-[14px] font-medium leading-6 text-[#666]">Account managers are Beag Labs Microsoft Entra identities. Sign in with an OID already authorized for licensing administration.</p>
          <button type="button" onClick={() => void signIn()} disabled={signingIn} className="nb-btn-orange mt-8 inline-flex items-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase">
            {signingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />} Continue with Microsoft
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0_#111] sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-[#111] bg-[#d9f99d]"><CheckCircle2 className="h-5 w-5" strokeWidth={3} /></div>
          <div>
            <div className="font-mono text-[9px] font-black uppercase tracking-[.14em] text-[#777]">Entra administrator</div>
            <div className="mt-1 text-[14px] font-extrabold">{admin.name || admin.email || admin.oid}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => void syncMe()} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><UserPlus className="h-4 w-4" /> Add/update me</button>
          <button type="button" onClick={() => void load()} disabled={loading} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
        </div>
      </section>

      <section>
        <div className="mb-5">
          <div className="font-mono text-[9px] font-black uppercase tracking-[.14em] text-[#b63700]">Internal identities</div>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.04em]">Account Managers</h2>
          <p className="mt-2 max-w-3xl text-[13px] font-medium leading-6 text-[#666]">Identity, email, and authorization originate from the Beag Labs Entra tenant. The customer-facing title, avatar override, and personal booking URL are stored in the provisioning control plane.</p>
        </div>
        {managers.length ? (
          <div className="grid gap-5 lg:grid-cols-2">
            {managers.map((manager) => {
              const managerId = String(manager.id)
              const form = editing[managerId] ?? { title: '', bookingUrl: '', avatarUrl: '' }
              const name = text(manager, 'display_name')
              return (
                <article key={managerId} className="border-[3px] border-[#111] bg-white p-6 shadow-[4px_4px_0_#111]">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 rounded-none border-[3px] border-[#111] bg-[#ff5f1f]">
                      {manager.avatar_url ? <AvatarImage src={String(manager.avatar_url)} alt="" className="rounded-none object-cover" /> : null}
                      <AvatarFallback className="rounded-none bg-[#ff5f1f] font-mono text-[11px] font-black">{initials(name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate text-[17px] font-extrabold">{name}</div>
                      <div className="truncate text-[11px] font-medium text-[#666]">{text(manager, 'email')}</div>
                      <div className="mt-1 font-mono text-[8px] font-bold uppercase text-[#888]">OID {text(manager, 'entra_oid')}</div>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-4">
                    <label><span className="mb-2 block font-mono text-[9px] font-black uppercase tracking-[.1em]">Customer-facing title</span><input className="nb-input w-full" value={form.title} onChange={(event) => setEditing((current) => ({ ...current, [managerId]: { ...form, title: event.target.value } }))} placeholder="Founder, Beag Labs" /></label>
                    <label><span className="mb-2 block font-mono text-[9px] font-black uppercase tracking-[.1em]">Personal booking URL</span><input className="nb-input w-full" value={form.bookingUrl} onChange={(event) => setEditing((current) => ({ ...current, [managerId]: { ...form, bookingUrl: event.target.value } }))} placeholder="https://bookings..." /></label>
                    <label><span className="mb-2 block font-mono text-[9px] font-black uppercase tracking-[.1em]">Avatar URL <em className="font-normal normal-case text-[#777]">optional</em></span><input className="nb-input w-full" value={form.avatarUrl} onChange={(event) => setEditing((current) => ({ ...current, [managerId]: { ...form, avatarUrl: event.target.value } }))} placeholder="https://..." /></label>
                  </div>
                  <div className="mt-5 flex items-center justify-between border-t-2 border-[#111] pt-4">
                    <div className="font-mono text-[9px] font-black uppercase text-[#777]">{Number(manager.organization_count ?? 0)} account(s)</div>
                    <button type="button" onClick={() => void saveManager(manager)} className="nb-btn-orange inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><Save className="h-3.5 w-3.5" /> Save profile</button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="border-2 border-dashed border-[#999] bg-white p-8 text-center text-[13px] font-semibold text-[#666]">No account managers yet. Select “Add/update me” to register your authorized Entra identity.</div>
        )}
      </section>

      <section>
        <div className="mb-5">
          <div className="font-mono text-[9px] font-black uppercase tracking-[.14em] text-[#b63700]">Customer ownership</div>
          <h2 className="mt-2 text-[28px] font-extrabold tracking-[-.04em]">Organization assignments</h2>
          <p className="mt-2 text-[13px] font-medium leading-6 text-[#666]">The organization-to-manager relationship lives in Beag Labs provisioning data, not Entra. Only active Entra-backed Account Managers can be assigned.</p>
        </div>
        <div className="overflow-x-auto border-[3px] border-[#111] bg-white">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-b-[3px] border-[#111] bg-[#111] text-white"><tr><th className="px-4 py-3 font-mono text-[9px] font-black uppercase">Organization</th><th className="px-4 py-3 font-mono text-[9px] font-black uppercase">Type</th><th className="px-4 py-3 font-mono text-[9px] font-black uppercase">Primary Account Manager</th></tr></thead>
            <tbody>{organizations.map((organization) => {
              const organizationId = String(organization.id)
              return (
                <tr key={organizationId} className="border-b-2 border-[#111] last:border-b-0">
                  <td className="px-4 py-4"><div className="text-[13px] font-extrabold">{text(organization,'display_name','legal_name')}</div><div className="mt-1 font-mono text-[8px] text-[#888]">{organizationId}</div></td>
                  <td className="px-4 py-4 text-[11px] font-semibold">{text(organization,'organization_type')}</td>
                  <td className="px-4 py-4">
                    <select className="nb-input min-w-[260px]" value={selected[organizationId] ?? ''} onChange={(event) => void assign(organizationId, event.target.value)}>
                      <option value="">Unassigned</option>
                      {activeManagers.map((manager) => <option key={String(manager.id)} value={String(manager.id)}>{text(manager,'display_name')} · {text(manager,'email')}</option>)}
                    </select>
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
