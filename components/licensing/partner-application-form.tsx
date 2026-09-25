"use client"

import { Check, Loader2, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { licenseFetch } from '@/lib/license-control-plane'

type Row = Record<string, unknown>
type Collection = { items: Row[] }

function value(row: Row, key: string): string {
  const result = row[key]
  return result === null || result === undefined ? '' : String(result)
}

function price(cents: unknown): string {
  if (cents === null || cents === undefined) return 'Quote required'
  const amount = Number(cents)
  if (!Number.isFinite(amount)) return 'Quote required'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount / 100)
}

export function PartnerApplicationForm() {
  const [products, setProducts] = useState<Row[]>([])
  const [selectedSkus, setSelectedSkus] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    void licenseFetch<Collection>('/api/public/products')
      .then((result) => setProducts(result.items))
      .catch((error) => toast.error(error instanceof Error ? error.message : 'Unable to load partner catalog.'))
  }, [])

  const toggleSku = (sku: string) => {
    setSelectedSkus((current) => current.includes(sku) ? current.filter((item) => item !== sku) : [...current, sku])
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (!selectedSkus.length) {
      toast.error('Select at least one Papyrus SKU.')
      return
    }

    setSubmitting(true)
    try {
      await licenseFetch('/api/partner/applications', {
        method: 'POST',
        body: JSON.stringify({
          companyName: form.get('companyName'),
          companyDomain: form.get('companyDomain'),
          annualRevenueUsd: Number(form.get('annualRevenueUsd')),
          uei: form.get('uei'),
          cage: form.get('cage'),
          partnerType: form.get('partnerType'),
          pocName: form.get('pocName'),
          pocEmail: form.get('pocEmail'),
          skuInterests: selectedSkus,
          website: form.get('website') || '',
        }),
      })
      setSubmitted(true)
      toast.success('Partner application submitted for review.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to submit partner application.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="border-[3px] border-[#111] bg-[#d9f99d] p-8 shadow-[7px_7px_0px_0px_#111]">
        <div className="mb-5 flex h-12 w-12 items-center justify-center border-[3px] border-[#111] bg-white"><Check className="h-6 w-6" strokeWidth={3} /></div>
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.16em]">Application received</span>
        <h2 className="mt-3 text-[28px] font-extrabold tracking-[-0.04em]">Partner Operations has it.</h2>
        <p className="mt-4 max-w-2xl text-[14px] font-semibold leading-6 text-[#444]">Beag Labs will review the legal entity, federal identifiers, partner lane, and product interest before creating partner access. No account or contractual commitment is created by this submission.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="nb-panel p-6 sm:p-8 lg:p-10">
      <div className="mb-8">
        <span className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[#ff5f1f]">Legal entity onboarding</span>
        <h2 className="mt-3 text-[28px] font-extrabold tracking-[-0.04em]">Partner application</h2>
        <p className="mt-3 max-w-2xl text-[14px] font-medium leading-6 text-[#666]">Complete the entity and POC information below. Applications are manually reviewed before passwordless partner access is enabled.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Company name</span><input required name="companyName" maxLength={256} className="nb-input w-full" placeholder="Acme Federal Systems" /></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Company domain</span><input required name="companyDomain" className="nb-input w-full" placeholder="acme.example" /></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">UEI</span><input required name="uei" minLength={12} maxLength={12} pattern="[A-Za-z0-9]{12}" className="nb-input w-full font-mono uppercase" placeholder="12-character UEI" /></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">CAGE</span><input required name="cage" minLength={5} maxLength={5} pattern="[A-Za-z0-9]{5}" className="nb-input w-full font-mono uppercase" placeholder="5-character CAGE" /></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Annual revenue (USD)</span><input required name="annualRevenueUsd" type="number" min="0" step="1" className="nb-input w-full" placeholder="25000000" /></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Partner type</span><select required name="partnerType" className="nb-input w-full" defaultValue=""><option value="" disabled>Select partner lane…</option><option value="distributor">Distributor</option><option value="reseller">Reseller</option><option value="prime">Prime contractor</option><option value="systems_integrator">Systems integrator</option><option value="referral">Referral partner</option><option value="technology">Technology partner</option></select></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Main POC name</span><input required name="pocName" maxLength={200} className="nb-input w-full" placeholder="Jane Doe" /></label>
        <label className="space-y-2"><span className="font-mono text-[10px] font-black uppercase tracking-[0.12em]">Main POC email</span><input required name="pocEmail" type="email" className="nb-input w-full" placeholder="jane@acme.example" /></label>
      </div>

      <div className="mt-8">
        <div className="mb-3 font-mono text-[10px] font-black uppercase tracking-[0.12em]">Papyrus SKUs of interest</div>
        <div className="grid gap-3 lg:grid-cols-2">
          {products.map((product) => {
            const sku = value(product, 'sku')
            const selected = selectedSkus.includes(sku)
            return (
              <button key={sku} type="button" onClick={() => toggleSku(sku)} className={`flex items-start gap-4 border-[3px] border-[#111] p-4 text-left transition-transform ${selected ? 'bg-[#ff5f1f] shadow-[5px_5px_0px_0px_#111] -translate-x-[1px] -translate-y-[1px]' : 'bg-white hover:-translate-y-[1px]'}`}>
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center border-2 border-[#111] ${selected ? 'bg-[#111] text-white' : 'bg-[#FAFAF9]'}`}>{selected ? <Check className="h-4 w-4" strokeWidth={3} /> : null}</span>
                <span><span className="block font-mono text-[10px] font-black uppercase tracking-[0.08em]">{sku}</span><span className="mt-1 block text-[14px] font-extrabold">{value(product, 'name')}</span><span className="mt-1 block text-[12px] font-semibold text-[#555]">{price(product.list_price_cents)}</span></span>
              </button>
            )
          })}
        </div>
      </div>

      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      <div className="mt-8 flex flex-col gap-4 border-t-[3px] border-[#111] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-[12px] font-medium leading-5 text-[#777]">Submission starts review only. Pricing, agreement status, entitlement creation, and signed-license issuance remain Beag-controlled.</p>
        <button disabled={submitting} className="nb-btn-orange inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.12em] disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Submit for review</button>
      </div>
    </form>
  )
}
