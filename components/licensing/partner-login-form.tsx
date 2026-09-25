"use client"

import { ArrowRight, Loader2, Mail, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { licenseFetch } from '@/lib/license-control-plane'

export function PartnerLoginForm() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSending(true)
    try {
      const oauthQuery = searchParams.toString()
      const callbackPath = oauthQuery
        ? `/partners/oauth/consent?${oauthQuery}`
        : '/partners/portal'
      const errorPath = oauthQuery
        ? `/partners/login?${oauthQuery}&error=signin`
        : '/partners/login?error=signin'

      const body: Record<string, string> = {
        email,
        callbackURL: `${window.location.origin}${callbackPath}`,
        errorCallbackURL: `${window.location.origin}${errorPath}`,
      }
      if (oauthQuery) body.oauth_query = oauthQuery

      await licenseFetch('/api/auth/sign-in/magic-link', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      setSent(true)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'This email is not authorized for partner access.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="border-[3px] border-[#111] bg-[#d9f99d] p-8 shadow-[7px_7px_0px_0px_#111]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-white">
          <Mail className="h-6 w-6" strokeWidth={2.7} />
        </div>
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.15em]">Check your inbox</span>
        <h2 className="mt-3 text-[28px] font-extrabold tracking-[-0.04em]">Single-use sign-in link sent.</h2>
        <p className="mt-4 text-[14px] font-semibold leading-6 text-[#444]">
          If <strong>{email}</strong> belongs to an approved Beag Labs partner, the link will continue this sign-in securely without a password.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-stretch">
      <section className="border-[3px] border-[#111] bg-[#111] p-8 text-white shadow-[8px_8px_0px_0px_#ff5f1f] lg:p-10">
        <ShieldCheck className="h-8 w-8 text-[#ff5f1f]" />
        <span className="mt-8 block font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Approved partners only</span>
        <h2 className="mt-4 text-[34px] font-extrabold leading-[1] tracking-[-0.04em]">Passwordless channel access.</h2>
        <p className="mt-5 text-[14px] font-medium leading-6 text-[#ccc]">
          Partner identity remains controlled by the licensing service. A magic link is issued only for active partner users or a valid onboarding invitation.
        </p>
        <div className="mt-8 space-y-3 font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[#ddd]">
          <div className="border border-white/30 p-3">No shared passwords</div>
          <div className="border border-white/30 p-3">Approved legal entities only</div>
          <div className="border border-white/30 p-3">Order submission is audited</div>
        </div>
      </section>

      <form onSubmit={submit} className="nb-panel flex flex-col justify-between p-8 lg:p-10">
        <div>
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#ff5f1f]">Partner portal</span>
          <h1 className="mt-3 text-[32px] font-extrabold tracking-[-0.04em]">Sign in with your partner email.</h1>
          <p className="mt-4 max-w-xl text-[14px] font-medium leading-6 text-[#666]">
            Enter the email associated with your approved Beag Labs partner record. We will send a single-use authentication link.
          </p>
          <label className="mt-8 block space-y-2">
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Partner email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="nb-input w-full px-4 py-3"
              placeholder="you@partner.example"
            />
          </label>
        </div>
        <div className="mt-8">
          <button disabled={sending} className="nb-btn-orange flex w-full items-center justify-center gap-2 px-5 py-3.5 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:opacity-50">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send sign-in link
          </button>
          <div className="mt-6 flex flex-col gap-2 border-t-2 border-[#111] pt-5 text-[12px] font-semibold text-[#666] sm:flex-row sm:items-center sm:justify-between">
            <span>Not an approved partner?</span>
            <Link href="/partners/apply" className="inline-flex items-center gap-1 font-black text-[#111] underline decoration-2 underline-offset-4">
              Apply for access <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </form>
    </div>
  )
}
