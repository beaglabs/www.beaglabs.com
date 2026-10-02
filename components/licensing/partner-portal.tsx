"use client"

import { ArrowRight, Cloud, Mail, ShoppingBag } from 'lucide-react'
import Link from 'next/link'

export function PartnerPortal() {
  return (
    <div className="mx-auto max-w-[980px] space-y-8">
      <section className="border-[3px] border-[#111] bg-[#111] p-8 text-white shadow-[8px_8px_0px_0px_#ff5f1f] lg:p-10">
        <span className="inline-block border-2 border-white bg-[#ff5f1f] px-2.5 py-1 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-[#111]">
          Microsoft Marketplace
        </span>
        <h2 className="mt-6 max-w-[760px] text-[38px] font-extrabold leading-[0.98] tracking-[-0.045em] lg:text-[52px]">
          Papyrus commerce now runs through Microsoft Marketplace.
        </h2>
        <p className="mt-6 max-w-[720px] text-[16px] font-medium leading-7 text-[#d5d5d5]">
          Beag Labs no longer requires partners to register a deal or submit a duplicate order through a separate portal. Marketplace is the transaction path; Beag Labs keeps the customer, deployment, and support record behind the scenes.
        </p>
      </section>

      <div className="grid gap-6 md:grid-cols-3">
        <article className="border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0px_0px_#111]">
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-[#111] bg-[#ff5f1f]"><ShoppingBag className="h-5 w-5" /></div>
          <h3 className="mt-5 text-[20px] font-extrabold tracking-[-0.03em]">Purchase in Marketplace</h3>
          <p className="mt-3 text-[13px] font-medium leading-6 text-[#666]">Public, private-offer, and partner-led transactions stay in the Microsoft commercial channel instead of being recreated in Beag Labs.</p>
        </article>

        <article className="border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0px_0px_#111]">
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-[#111] bg-[#d9f99d]"><Cloud className="h-5 w-5" /></div>
          <h3 className="mt-5 text-[20px] font-extrabold tracking-[-0.03em]">Deploy normally</h3>
          <p className="mt-3 text-[13px] font-medium leading-6 text-[#666]">For the Azure VM offer, Azure handles deployment and Marketplace billing. Beag Labs observes the customer and deployment operationally rather than issuing a second online license.</p>
        </article>

        <article className="border-[3px] border-[#111] bg-white p-6 shadow-[5px_5px_0px_0px_#111]">
          <div className="flex h-11 w-11 items-center justify-center border-[3px] border-[#111] bg-[#fff0a6]"><Mail className="h-5 w-5" /></div>
          <h3 className="mt-5 text-[20px] font-extrabold tracking-[-0.03em]">Need a private transaction?</h3>
          <p className="mt-3 text-[13px] font-medium leading-6 text-[#666]">Contact Beag Labs for a private offer, deployment question, or channel coordination. You do not need to submit a deal registration first.</p>
        </article>
      </div>

      <section className="flex flex-col gap-4 border-[3px] border-[#111] bg-[#FAFAF9] p-6 shadow-[5px_5px_0px_0px_#111] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="font-mono text-[10px] font-black uppercase tracking-[0.14em] text-[#ff5f1f]">Commercial support</div>
          <div className="mt-2 text-[18px] font-extrabold">No partner login or deal submission required.</div>
        </div>
        <Link href="/support/commercial" className="nb-btn-orange inline-flex shrink-0 items-center justify-center gap-2 px-5 py-3 font-mono text-[10px] font-black uppercase tracking-[0.1em]">
          Contact Beag Labs <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  )
}
