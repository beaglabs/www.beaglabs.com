"use client"

import { ArrowRight, Loader2, LogOut, Package, RefreshCw, Send, ShoppingCart } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { LicenseControlPlaneError, licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }

function text(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[key]
    if (value !== undefined && value !== null && value !== '') return String(value)
  }
  return '—'
}

function money(cents: unknown): string {
  if (cents === null || cents === undefined || cents === '') return 'Quote required'
  const n = Number(cents)
  if (!Number.isFinite(n)) return 'Quote required'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n / 100)
}

function dateTime(value: unknown): string {
  if (!value) return '—'
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return String(value)
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(parsed)
}

function badge(status: unknown): string {
  const value = String(status ?? 'submitted').toLowerCase()
  if (['booked', 'fulfilled', 'active'].includes(value)) return 'bg-[#d9f99d]'
  if (['draft', 'submitted', 'pending'].includes(value)) return 'bg-[#fff0a6]'
  if (['cancelled', 'rejected'].includes(value)) return 'bg-[#fecaca]'
  return 'bg-white'
}

export function PartnerPortal() {
  const [checking, setChecking] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [catalog, setCatalog] = useState<Row[]>([])
  const [orders, setOrders] = useState<Row[]>([])
  const [form, setForm] = useState({ sku: '', quantity: '1', endCustomerName: '', endCustomerUei: '', endCustomerCage: '', notes: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [catalogResult, orderResult] = await Promise.all([
        licenseFetch<Collection>('/api/partner/catalog'),
        licenseFetch<Collection>('/api/partner/orders'),
      ])
      setCatalog(catalogResult.items)
      setOrders(orderResult.items)
      setAuthorized(true)
      setForm((current) => ({ ...current, sku: current.sku || text(catalogResult.items[0] ?? {}, 'sku') }))
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) {
        setAuthorized(false)
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load partner portal.')
      }
    } finally {
      setChecking(false)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const signOut = async () => {
    try { await licenseFetch('/api/auth/sign-out', { method: 'POST', body: '{}' }) } catch {}
    setAuthorized(false)
  }

  const submitOrder = async (event: React.FormEvent) => {
    event.preventDefault()
    try {
      await licenseFetch('/api/partner/orders', {
        method: 'POST',
        body: JSON.stringify({
          sku: form.sku,
          quantity: Number(form.quantity),
          endCustomerName: form.endCustomerName.trim() || null,
          endCustomerUei: form.endCustomerUei.trim() || null,
          endCustomerCage: form.endCustomerCage.trim() || null,
          notes: form.notes.trim() || null,
        }),
      })
      toast.success('Order request submitted to Beag Labs.')
      setForm((current) => ({ ...current, quantity: '1', endCustomerName: '', endCustomerUei: '', endCustomerCage: '', notes: '' }))
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit partner order.')
    }
  }

  if (checking) {
    return <div className="flex min-h-[440px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[10px] font-black uppercase tracking-[0.12em]"><Loader2 className="h-4 w-4 animate-spin" /> Verifying partner access</div></div>
  }

  if (!authorized) {
    return (
      <div className="mx-auto max-w-[760px] border-[3px] border-[#111] bg-white p-8 text-center shadow-[7px_7px_0px_0px_#111] lg:p-10">
        <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f]"><Package className="h-6 w-6" /></div>
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Partner portal</span>
        <h2 className="mt-3 text-[30px] font-extrabold tracking-[-0.04em]">Approved partner sign-in required.</h2>
        <p className="mx-auto mt-4 max-w-xl text-[14px] font-medium leading-6 text-[#666]">Use the passwordless link sent to the email attached to your approved Beag Labs partner record.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/partners/login" className="nb-btn-orange inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em]">Partner sign in <ArrowRight className="h-4 w-4" /></Link>
          <Link href="/partners/apply" className="nb-btn-white inline-flex items-center justify-center px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em]">Apply for access</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 border-[3px] border-[#111] bg-white p-5 shadow-[5px_5px_0px_0px_#111] sm:flex-row sm:items-center sm:justify-between">
        <div><div className="font-mono text-[9px] font-black uppercase tracking-[0.15em] text-[#777]">Approved partner session</div><div className="mt-1 text-[15px] font-extrabold">Commercial order portal</div></div>
        <div className="flex gap-3"><button type="button" onClick={() => void load()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh</button><button type="button" onClick={() => void signOut()} className="nb-btn-white inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[9px] font-black uppercase"><LogOut className="h-3.5 w-3.5" /> Sign out</button></div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.78fr_1.22fr]">
        <form onSubmit={submitOrder} className="nb-panel h-fit p-6 lg:p-8">
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">New order request</span>
          <h2 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em]">Submit Papyrus order.</h2>
          <p className="mt-3 text-[13px] font-medium leading-6 text-[#666]">Partner submissions remain draft commercial records until Beag Labs reviews and books them. Entitlements and signed licenses are never created by partner self-service.</p>
          <div className="mt-7 space-y-5">
            <label className="block space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">SKU</span><select required className="nb-input w-full" value={form.sku} onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}>{catalog.map((row) => <option key={text(row, 'sku')} value={text(row, 'sku')}>{text(row, 'sku')} — {text(row, 'name')} — {money(row.list_price_cents)}</option>)}</select></label>
            <label className="block space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Quantity</span><input required type="number" min="1" max="100" className="nb-input w-full" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} /></label>
            <label className="block space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">End customer</span><input className="nb-input w-full" value={form.endCustomerName} onChange={(event) => setForm((current) => ({ ...current, endCustomerName: event.target.value }))} placeholder="Optional legal customer name" /></label>
            <div className="grid grid-cols-2 gap-4"><label className="block space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">End customer UEI</span><input className="nb-input w-full font-mono uppercase" minLength={12} maxLength={12} pattern="[A-Za-z0-9]{12}" value={form.endCustomerUei} onChange={(event) => setForm((current) => ({ ...current, endCustomerUei: event.target.value }))} /></label><label className="block space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">CAGE</span><input className="nb-input w-full font-mono uppercase" minLength={5} maxLength={5} pattern="[A-Za-z0-9]{5}" value={form.endCustomerCage} onChange={(event) => setForm((current) => ({ ...current, endCustomerCage: event.target.value }))} /></label></div>
            <label className="block space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Notes</span><textarea className="nb-input min-h-28 w-full resize-y" maxLength={4000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Vehicle, program, procurement timing, deployment constraints…" /></label>
            <button className="nb-btn-orange flex w-full items-center justify-center gap-2 px-5 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.12em]"><Send className="h-4 w-4" /> Submit order request</button>
          </div>
        </form>

        <section className="nb-panel overflow-hidden">
          <div className="border-b-[3px] border-[#111] p-6"><span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Order history</span><h2 className="mt-3 text-[26px] font-extrabold tracking-[-0.04em]">{orders.length} partner submissions</h2></div>
          {orders.length === 0 ? <div className="p-8 text-center text-[13px] font-semibold text-[#777]">No partner order requests yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]"><tr><th className="border-b-2 border-[#111] px-5 py-3">Order</th><th className="border-b-2 border-[#111] px-5 py-3">Status</th><th className="border-b-2 border-[#111] px-5 py-3">End customer</th><th className="border-b-2 border-[#111] px-5 py-3">Submitted</th></tr></thead><tbody>{orders.map((row) => <tr key={text(row, 'id')} className="border-b border-[#ddd] last:border-0"><td className="px-5 py-4"><div className="font-mono text-[10px] font-bold">{text(row, 'id')}</div><div className="mt-1 text-[12px] font-semibold text-[#666]">{money(row.total_cents)}</div></td><td className="px-5 py-4"><span className={`${badge(row.status)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[9px] font-black uppercase tracking-[0.08em]`}>{text(row, 'status')}</span></td><td className="px-5 py-4"><div className="text-[13px] font-bold">{text(row, 'end_customer_name')}</div><div className="mt-1 font-mono text-[9px] text-[#777]">{text(row, 'end_customer_uei')} · {text(row, 'end_customer_cage')}</div></td><td className="px-5 py-4 text-[12px] font-medium text-[#666]">{dateTime(row.submitted_at ?? row.created_at)}</td></tr>)}</tbody></table></div>}
        </section>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2"><ShoppingCart className="h-5 w-5" /><h2 className="text-[20px] font-extrabold tracking-[-0.03em]">Current partner catalog</h2></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{catalog.map((row) => <div key={text(row, 'sku')} className="border-[3px] border-[#111] bg-white p-5 shadow-[4px_4px_0px_0px_#111]"><div className="font-mono text-[10px] font-black uppercase tracking-[0.12em] text-[#ff5f1f]">{text(row, 'sku')}</div><div className="mt-2 text-[16px] font-extrabold">{text(row, 'name')}</div><div className="mt-3 font-mono text-[12px] font-black">{money(row.list_price_cents)}</div><p className="mt-3 text-[12px] font-medium leading-5 text-[#666]">{text(row, 'description')}</p></div>)}</div>
      </section>
    </div>
  )
}
