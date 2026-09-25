"use client"

import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { licenseFetch } from '@/lib/license-control-plane'

type Invite = { companyName: string; email: string; expiresAt: string }

export function PartnerInvite() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  const [invite, setInvite] = useState<Invite | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) {
      setError('This invitation link is missing its secure token.')
      setLoading(false)
      return
    }
    void licenseFetch<Invite>(`/api/public/partner-invite?token=${encodeURIComponent(token)}`)
      .then(setInvite)
      .catch((cause) => setError(cause instanceof Error ? cause.message : 'This invitation is invalid or expired.'))
      .finally(() => setLoading(false))
  }, [token])

  const send = async () => {
    setSending(true)
    try {
      await licenseFetch('/api/partner/invite/send', {
        method: 'POST',
        body: JSON.stringify({ token }),
      })
      setSent(true)
      toast.success('Secure partner sign-in link sent.')
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : 'Unable to send invitation link.')
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[10px] font-black uppercase tracking-[0.12em]"><Loader2 className="h-4 w-4 animate-spin" /> Verifying invitation</div></div>

  if (error || !invite) {
    return <div className="mx-auto max-w-[720px] border-[3px] border-[#111] bg-[#fecaca] p-8 shadow-[7px_7px_0px_0px_#111]"><h1 className="text-[28px] font-extrabold tracking-[-0.04em]">Invitation unavailable.</h1><p className="mt-4 text-[14px] font-semibold leading-6">{error || 'This invitation is no longer active.'}</p><Link href="/partners/login" className="nb-btn-white mt-7 inline-flex px-5 py-3 font-mono text-[10px] font-black uppercase">Partner sign in</Link></div>
  }

  return (
    <div className="mx-auto grid max-w-[1000px] gap-8 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="border-[3px] border-[#111] bg-[#111] p-8 text-white shadow-[8px_8px_0px_0px_#ff5f1f]">
        <CheckCircle2 className="h-8 w-8 text-[#ff5f1f]" />
        <span className="mt-8 block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Approved partner</span>
        <h1 className="mt-4 text-[34px] font-extrabold leading-[1] tracking-[-0.04em]">Join {invite.companyName} on Beag Labs.</h1>
        <p className="mt-5 text-[14px] font-medium leading-6 text-[#ccc]">Your company has passed partner review. The final identity-registration step is passwordless and bound to the approved email address.</p>
      </section>

      <section className="nb-panel flex flex-col justify-between p-8 lg:p-10">
        <div>
          <div className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#777]">Approved email</div>
          <div className="mt-2 break-all text-[18px] font-extrabold">{invite.email}</div>
          <div className="mt-6 border-2 border-[#111] bg-[#FAFAF9] p-4 text-[12px] font-semibold leading-5 text-[#666]">Invitation expires {new Date(invite.expiresAt).toLocaleString()}.</div>
        </div>
        {sent ? (
          <div className="mt-8 border-[3px] border-[#111] bg-[#d9f99d] p-5"><div className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Check your inbox</div><p className="mt-2 text-[13px] font-semibold leading-5">Use the single-use link to finish activation and enter the partner portal.</p></div>
        ) : (
          <button type="button" disabled={sending} onClick={() => void send()} className="nb-btn-orange mt-8 flex w-full items-center justify-center gap-2 px-5 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:opacity-50">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send secure activation link</button>
        )}
      </section>
    </div>
  )
}
