"use client"

import { Check, Loader2, ShieldAlert, X } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { LICENSE_CONTROL_PLANE_ORIGIN, LicenseControlPlaneError, licenseFetch } from '@/lib/license-control-plane'

export function PartnerOAuthConsent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState<'allow' | 'deny' | null>(null)

  const query = searchParams.toString()
  const clientId = searchParams.get('client_id') || 'Unknown OAuth client'
  const scope = searchParams.get('scope') || 'openid profile email'
  const scopes = useMemo(() => scope.split(/\s+/).filter(Boolean), [scope])

  useEffect(() => {
    void licenseFetch('/api/partner/catalog')
      .then(() => setChecking(false))
      .catch((error) => {
        if (error instanceof LicenseControlPlaneError && error.status === 401) {
          const suffix = query ? `?${query}` : ''
          router.replace(`/partners/login${suffix}`)
          return
        }
        setChecking(false)
        toast.error(error instanceof Error ? error.message : 'Unable to verify partner session.')
      })
  }, [query, router])

  const decide = async (accept: boolean) => {
    setSubmitting(accept ? 'allow' : 'deny')
    try {
      const response = await fetch(`${LICENSE_CONTROL_PLANE_ORIGIN}/api/auth/oauth2/consent`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accept, scope, oauth_query: query }),
        redirect: 'follow',
      })

      const body = await response.clone().json().catch(() => ({} as Record<string, unknown>)) as Record<string, unknown>
      const target = response.redirected
        ? response.url
        : String(body.url ?? body.redirectURI ?? body.redirectUri ?? '')

      if (target) {
        window.location.assign(target)
        return
      }
      if (!response.ok) throw new Error(String(body.message ?? body.error ?? 'Unable to record authorization decision.'))
      toast.success(accept ? 'Authorization granted.' : 'Authorization denied.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to record authorization decision.')
    } finally {
      setSubmitting(null)
    }
  }

  if (checking) {
    return <div className="flex min-h-[420px] items-center justify-center"><div className="nb-panel flex items-center gap-3 px-7 py-5 font-mono text-[10px] font-black uppercase tracking-[0.12em]"><Loader2 className="h-4 w-4 animate-spin" /> Verifying partner session</div></div>
  }

  return (
    <div className="mx-auto max-w-[920px]">
      <section className="border-[3px] border-[#111] bg-white shadow-[7px_7px_0px_0px_#111]">
        <div className="border-b-[3px] border-[#111] bg-[#fff0a6] p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[3px] border-[#111] bg-white"><ShieldAlert className="h-5 w-5" strokeWidth={2.7} /></div>
            <div>
              <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em]">Application authorization</span>
              <h1 className="mt-2 text-[30px] font-extrabold tracking-[-0.04em]">Review requested partner access.</h1>
              <p className="mt-3 text-[14px] font-semibold leading-6 text-[#555]">Only continue if you recognize the application and expected this authorization request.</p>
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
            <div className="border-2 border-[#111] bg-[#FAFAF9] p-5">
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#777]">OAuth client</div>
              <div className="mt-2 break-all font-mono text-[12px] font-black">{clientId}</div>
            </div>
            <div className="border-2 border-[#111] p-5">
              <div className="font-mono text-[9px] font-black uppercase tracking-[0.14em] text-[#777]">Requested scopes</div>
              <div className="mt-3 flex flex-wrap gap-2">{scopes.map((item) => <span key={item} className="border-2 border-[#111] bg-white px-2.5 py-1.5 font-mono text-[10px] font-black">{item}</span>)}</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t-[3px] border-[#111] pt-6 sm:flex-row sm:justify-end">
            <button type="button" disabled={Boolean(submitting)} onClick={() => void decide(false)} className="nb-btn-white inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50">{submitting === 'deny' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />} Deny</button>
            <button type="button" disabled={Boolean(submitting)} onClick={() => void decide(true)} className="nb-btn-orange inline-flex items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em] disabled:opacity-50">{submitting === 'allow' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Allow access</button>
          </div>
        </div>
      </section>
    </div>
  )
}
