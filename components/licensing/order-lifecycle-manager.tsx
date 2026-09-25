"use client"

import { CheckCircle2, Loader2, RefreshCw, RotateCcw, XCircle } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LicenseControlPlaneError, licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }
type OrderStatus = 'draft' | 'booked' | 'fulfilled' | 'cancelled' | 'refunded'

type Transition = {
  status: OrderStatus
  label: string
  confirmation: string
  className: string
  icon: typeof CheckCircle2
}

function value(row: Row, ...keys: string[]): string {
  for (const key of keys) {
    const candidate = row[key]
    if (candidate !== null && candidate !== undefined && candidate !== '') return String(candidate)
  }
  return '—'
}

function shortId(input: unknown, length = 16): string {
  const raw = String(input ?? '')
  return raw.length > length ? `${raw.slice(0, length)}…` : raw || '—'
}

function money(cents: unknown): string {
  if (cents === null || cents === undefined || cents === '') return 'Quote required'
  const amount = Number(cents)
  if (!Number.isFinite(amount)) return 'Quote required'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount / 100)
}

function statusClass(status: string): string {
  if (status === 'draft') return 'bg-[#fff0a6]'
  if (status === 'booked') return 'bg-[#ffd7c7]'
  if (status === 'fulfilled') return 'bg-[#d9f99d]'
  if (status === 'cancelled' || status === 'refunded') return 'bg-[#fecaca]'
  return 'bg-white'
}

function transitionsFor(status: string): Transition[] {
  if (status === 'draft') {
    return [
      {
        status: 'booked',
        label: 'Book order',
        confirmation: 'Book this draft order? This records the commercial commitment and makes its order items eligible for entitlement issuance.',
        className: 'nb-btn-orange',
        icon: CheckCircle2,
      },
      {
        status: 'cancelled',
        label: 'Cancel',
        confirmation: 'Cancel this draft order?',
        className: 'nb-btn-white',
        icon: XCircle,
      },
    ]
  }

  if (status === 'booked') {
    return [
      {
        status: 'fulfilled',
        label: 'Mark fulfilled',
        confirmation: 'Mark this booked order fulfilled? Use this after the purchased order has been provisioned/completed.',
        className: 'nb-btn-orange',
        icon: CheckCircle2,
      },
      {
        status: 'cancelled',
        label: 'Cancel',
        confirmation: 'Cancel this booked order? Confirm the commercial cancellation before continuing.',
        className: 'nb-btn-white',
        icon: XCircle,
      },
    ]
  }

  if (status === 'fulfilled') {
    return [
      {
        status: 'refunded',
        label: 'Mark refunded',
        confirmation: 'Mark this fulfilled order refunded? This is a commercial record change and will be audit logged.',
        className: 'nb-btn-white',
        icon: RotateCcw,
      },
    ]
  }

  return []
}

export function OrderLifecycleManager() {
  const [orders, setOrders] = useState<Row[]>([])
  const [authorized, setAuthorized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await licenseFetch('/api/v1/me')
      const result = await licenseFetch<Collection>('/api/v1/orders?limit=250')
      setOrders(result.items)
      setAuthorized(true)
    } catch (error) {
      if (error instanceof LicenseControlPlaneError && error.status === 401) {
        setAuthorized(false)
        setOrders([])
      } else {
        toast.error(error instanceof Error ? error.message : 'Unable to load order workflow.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const actionable = useMemo(
    () => orders.filter((row) => ['draft', 'booked', 'fulfilled'].includes(value(row, 'status'))),
    [orders],
  )

  const changeStatus = async (row: Row, transition: Transition) => {
    const orderId = value(row, 'id')
    if (orderId === '—') return
    if (!window.confirm(transition.confirmation)) return

    setBusyOrderId(orderId)
    try {
      const updated = await licenseFetch<Row>(`/api/v1/orders/${encodeURIComponent(orderId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: transition.status }),
      })
      setOrders((current) => current.map((item) => value(item, 'id') === orderId ? updated : item))
      toast.success(`Order moved to ${transition.status}.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to update order status.')
    } finally {
      setBusyOrderId(null)
    }
  }

  if (!authorized && !loading) return null

  return (
    <section className="mb-8 border-[3px] border-[#111] bg-white shadow-[6px_6px_0px_0px_#111]">
      <div className="flex flex-col gap-4 border-b-[3px] border-[#111] p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
        <div>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Commercial workflow</span>
          <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.035em] text-[#111]">Order approvals & lifecycle</h2>
          <p className="mt-2 max-w-3xl text-[13px] font-medium leading-6 text-[#666]">
            Move partner-submitted drafts into booked commercial records, complete fulfilled orders, or record cancellations/refunds. Every transition is enforced by the licensing API and written to the audit log.
          </p>
        </div>
        <button type="button" onClick={() => void load()} disabled={loading} className="nb-btn-white inline-flex shrink-0 items-center justify-center gap-2 px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex items-center gap-3 p-6 font-mono text-[10px] font-black uppercase tracking-[0.1em] text-[#777]">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading order workflow
        </div>
      ) : actionable.length === 0 ? (
        <div className="m-6 border-2 border-dashed border-[#aaa] bg-[#FAFAF9] px-5 py-7 text-center text-[13px] font-semibold text-[#777]">
          No orders currently require a lifecycle action.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-[#FAFAF9] font-mono text-[9px] font-black uppercase tracking-[0.12em]">
              <tr>
                <th className="border-b-2 border-[#111] px-5 py-3">Customer</th>
                <th className="border-b-2 border-[#111] px-5 py-3">Status</th>
                <th className="border-b-2 border-[#111] px-5 py-3">Total</th>
                <th className="border-b-2 border-[#111] px-5 py-3">Order ID</th>
                <th className="border-b-2 border-[#111] px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actionable.map((row) => {
                const orderId = value(row, 'id')
                const status = value(row, 'status')
                const busy = busyOrderId === orderId
                return (
                  <tr key={orderId} className="border-b border-[#ddd] last:border-0">
                    <td className="px-5 py-4">
                      <div className="font-extrabold">{value(row, 'customer_name', 'customer_organization_id')}</div>
                      {row.partner_company_name ? <div className="mt-1 text-[11px] font-semibold text-[#777]">Partner: {String(row.partner_company_name)}</div> : null}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`${statusClass(status)} inline-flex border-2 border-[#111] px-2 py-1 font-mono text-[10px] font-black uppercase tracking-[0.08em]`}>{status}</span>
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] font-bold">{money(row.total_cents)}</td>
                    <td className="px-5 py-4 font-mono text-[10px] text-[#777]" title={orderId}>{shortId(orderId)}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        {transitionsFor(status).map((transition) => {
                          const Icon = transition.icon
                          return (
                            <button
                              key={transition.status}
                              type="button"
                              disabled={busy}
                              onClick={() => void changeStatus(row, transition)}
                              className={`${transition.className} inline-flex items-center gap-2 px-3 py-2 font-mono text-[9px] font-black uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-50`}
                            >
                              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
                              {transition.label}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
