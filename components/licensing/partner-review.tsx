"use client"

import { Check, Loader2, ShieldCheck, X } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { LICENSE_CONTROL_PLANE_ORIGIN, licenseFetch } from '@/lib/license-control-plane'

type Review = {
  id: string
  companyName: string
  companyDomain: string
  annualRevenueUsd: number
  uei: string
  cage: string
  partnerType: string
  pocName: string
  pocEmail: string
  skus: string[]
  createdAt: string
  expiresAt: string
}

export function PartnerReview() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const suggestedDecision = searchParams.get('decision')
  const [review, setReview] = useState<Review | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState<'approve' | 'reject' | null>(null)
  const [complete, setComplete] = useState<'approve' | 'reject' | null>(null)

  useEffect(() => {
    if (!token) {
      setError('This review link is missing its secure token.')
      setLoading(false)
      return
    }
    void licenseFetch<Review>(`/api/public/partner-application-review?token=${encodeURIComponent(token)}`)
      .then(setReview)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'This review link is invalid or expired.'))
      .finally(() => setLoading(false))
  }, [token])

  const decide = async (decision: 'approve' | 'reject') => {
    setSubmitting(decision)
    try {
      const form = new URLSearchParams({ token, decision })
      const response = await fetch(`${LICENSE_CONTROL_PLANE_ORIGIN}/partner-application/decision`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: form.toString(),
      })
      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(body ? 'Unable to record partner decision.' : `Decision failed with HTTP ${response.status}.`)
      }
      setComplete(decision)
      toast.success(decision === 'approve' ? 'Partner application approved.' : 'Partner application rejected.')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to record partner decision.')
    } finally {
      setSubmitting(null)
    }
  }

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[10px] font-black uppercase tracking-[0.12em]"><Loader2 className="h-4 w-4 animate-spin" /> Loading partner review</div></div>

  if (error || !review) {
    return <div className="mx-auto max-w-[760px] border-[3px] border-[#111] bg-[#fecaca] p-8 shadow-[7px_7px_0px_0px_#111]"><h1 className="text-[28px] font-extrabold tracking-[-0.04em]">Review unavailable.</h1><p className="mt-4 text-[14px] font-semibold leading-6">{error || 'This application is no longer pending.'}</p><Link href="/licensing" className="nb-btn-white mt-7 inline-flex px-5 py-3 font-mono text-[10px] font-black uppercase">Open licensing administration</Link></div>
  }

  if (complete) {
    return <div className={`mx-auto max-w-[760px] border-[3px] border-[#111] p-8 shadow-[7px_7px_0px_0px_#111] ${complete === 'approve' ? 'bg-[#d9f99d]' : 'bg-[#fecaca]'}`}><div className="mb-5 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-white">{complete === 'approve' ? <Check className="h-6 w-6" strokeWidth={3} /> : <X className="h-6 w-6" strokeWidth={3} />}</div><span className="font-mono text-[10px] font-black uppercase tracking-[0.15em]">Decision recorded</span><h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.04em]">{review.companyName} was {complete === 'approve' ? 'approved' : 'rejected'}.</h1><p className="mt-4 text-[14px] font-semibold leading-6">{complete === 'approve' ? 'The approved POC will receive the partner onboarding invitation. Commercial and licensing authority remains Beag-controlled.' : 'No partner account was created.'}</p><Link href="/licensing" className="nb-btn-white mt-7 inline-flex px-5 py-3 font-mono text-[10px] font-black uppercase">Return to licensing</Link></div>
  }

  return (
    <div className="mx-auto max-w-[1060px]">
      <section className="border-[3px] border-[#111] bg-white shadow-[7px_7px_0px_0px_#111]">
        <header className="border-b-[3px] border-[#111] bg-[#fff0a6] p-6 sm:p-8">
          <div className="flex items-start gap-4"><div className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-[#111] bg-white"><ShieldCheck className="h-5 w-5" strokeWidth={2.7} /></div><div><span className="font-mono text-[10px] font-black uppercase tracking-[0.16em]">Partner Operations review</span><h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em]">{review.companyName}</h1><p className="mt-2 text-[13px] font-semibold text-[#555]">Review the legal entity and requested channel access before recording a decision.</p></div></div>
        </header>

        <div className="p-6 sm:p-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[
              ['Domain', review.companyDomain],
              ['Partner type', review.partnerType],
              ['Annual revenue', new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(review.annualRevenueUsd)],
              ['UEI', review.uei],
              ['CAGE', review.cage],
              ['POC', `${review.pocName} · ${review.pocEmail}`],
            ].map(([label, value]) => <div key={label} className="border-2 border-[#111] bg-[#FAFAF9] p-4"><div className="font-mono text-[9px] font-black uppercase tracking-[0.13em] text-[#777]">{label}</div><div className="mt-2 break-words text-[13px] font-extrabold">{value}</div></div>)}
          </div>

          <div className="mt-6 border-2 border-[#111] p-5"><div className="font-mono text-[9px] font-black uppercase tracking-[0.13em] text-[#777]">Requested SKUs</div><div className="mt-3 flex flex-wrap gap-2">{review.skus.map((sku) => <span key={sku} className="border-2 border-[#111] bg-white px-2.5 py-1.5 font-mono text-[10px] font-black">{sku}</span>)}</div></div>

          {suggestedDecision === 'approve' || suggestedDecision === 'reject' ? <div className="mt-6 border-2 border-[#111] bg-[#FAFAF9] p-4 text-[12px] font-semibold">The email link suggested <strong>{suggestedDecision}</strong>. Nothing happens until you explicitly press a decision button below.</div> : null}

          <div className="mt-8 flex flex-col gap-3 border-t-[3px] border-[#111] pt-6 sm:flex-row sm:justify-end">
            <button type="button" disabled={Boolean(submitting)} onClick={() => void decide('reject')} className="nb-btn-white inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50">{submitting === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Reject</button>
            <button type="button" disabled={Boolean(submitting)} onClick={() => void decide('approve')} className="nb-btn-orange inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50">{submitting === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Approve partner</button>
          </div>
        </div>
      </section>
    </div>
  )
}
