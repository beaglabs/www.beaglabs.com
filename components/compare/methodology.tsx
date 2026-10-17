import Link from 'next/link'
import { company } from '@/data/company'
import { verifiedOn } from '@/lib/compare'
import { StatusBadge } from '@/components/compare/evidence-cell'

const principles = [
  {
    title: 'We disclose our interest',
    body: 'Beag Labs makes Papyrus, one of the platforms compared here. Papyrus cells cite our own pages and are labelled first-party. Read every comparison with that in mind.',
  },
  {
    title: 'Every statement is cited',
    body: 'Each Verified or Not supported cell links to a record in the Claim Ledger with the source URL, where on the page it appears, the date we checked it, approved wording, and what it does not prove.',
  },
  {
    title: 'Documentation, not hands-on testing',
    body: 'These comparisons are built from vendor documentation, official listings and repositories. Beag Labs has not run hands-on tests of the compared products. We classify what is documented; we do not score or rank quality, and nothing here is a benchmark.',
  },
  {
    title: 'Missing documentation is not a missing feature',
    body: 'If we cannot find a capability in official sources we say Not documented and list what we checked. We only say Not supported or Partially supported when a source itself says so.',
  },
]

export function Methodology({ compact = false }: { compact?: boolean }) {
  return (
    <section id="methodology" className="scroll-mt-12 border-[3px] border-[#111] bg-white p-6 shadow-[6px_6px_0_#111] sm:p-8">
      <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#b33d0d]">Methodology and disclosure</p>
      <h2 className="mt-3 max-w-[760px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.04em] sm:text-[36px]">
        How these comparisons are built and checked.
      </h2>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {principles.map((item) => (
          <div key={item.title} className="border-t-[3px] border-[#ff5f1f] pt-4">
            <h3 className="text-[16px] font-extrabold">{item.title}</h3>
            <p className="mt-2 text-[14px] font-medium leading-[1.7] text-[#444]">{item.body}</p>
          </div>
        ))}
      </div>
      <dl className="mt-8 grid gap-4 border-t-2 border-[#111] pt-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <dt><StatusBadge status="Verified" /></dt>
          <dd className="text-[13px] font-medium leading-[1.6] text-[#444]">An official source we fetched states it. The cell links to the claim record.</dd>
        </div>
        <div className="space-y-2">
          <dt><StatusBadge status="Partially supported" /></dt>
          <dd className="text-[13px] font-medium leading-[1.6] text-[#444]">An official source documents the capability but states a limit: one surface, a subset of actions, or an explicit exclusion. The cell says what the limit is.</dd>
        </div>
        <div className="space-y-2">
          <dt><StatusBadge status="Not documented" /></dt>
          <dd className="text-[13px] font-medium leading-[1.6] text-[#444]">We checked official sources and found nothing either way. This is not evidence the capability is absent.</dd>
        </div>
        <div className="space-y-2">
          <dt><StatusBadge status="Not supported" /></dt>
          <dd className="text-[13px] font-medium leading-[1.6] text-[#444]">An official source explicitly says the capability is absent or unsupported.</dd>
        </div>
      </dl>
      {!compact && (
        <p className="mt-8 border-t-2 border-[#111] pt-5 text-[13px] font-medium leading-[1.7] text-[#444]">
          Last verified {verifiedOn}. Vendors change products and pricing; treat these pages as a starting point and confirm
          anything decisive with the vendor. If we got something wrong or a vendor has newer documentation, write to{' '}
          <a className="font-bold underline underline-offset-2" href={`mailto:${company.email}`}>{company.email}</a> and we will
          re-check the claim and update the ledger. Browse every record in the{' '}
          <Link className="font-bold underline underline-offset-2" href="/claims">Claim Ledger</Link>.
        </p>
      )}
    </section>
  )
}
