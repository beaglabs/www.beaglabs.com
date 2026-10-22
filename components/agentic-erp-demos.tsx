import { SystemsNetwork } from '@/components/demos/systems-network'
import { InvoiceRun } from '@/components/demos/invoice-run'
import { ActionLedger } from '@/components/demos/action-ledger'

/** Agentic ERP, shown working: the systems map, a multi-entity invoice run, and the governed write. */
export function AgenticErpDemos() {
  return <section id="see-it-work" className="site-hero border-b-[3px] border-[#111] px-6 py-20 lg:px-9">
    <div className="mx-auto max-w-[1200px] space-y-20">
      <div>
        <span className="nb-label mb-5 inline-block">See it work</span>
        <h2 className="display-black max-w-[900px] text-[length:min(40px,9vw)] leading-[.95] sm:text-[60px]">Your ERP stays in charge. Papyrus runs between.</h2>
        <p className="mt-5 max-w-[720px] border-l-[3px] border-[#ff5f1f] bg-white pl-4 text-[16px] leading-7">Working demos on sample data. Pick a system to see what Papyrus reads and writes there, then run one invoice across two legal entities.</p>
      </div>
      <div>
        <p className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#c2410c]">01 / Systems map</p>
        <h3 className="mb-5 mt-1 text-[26px] font-extrabold leading-tight sm:text-[32px]">Reads everywhere. Writes only through approvals.</h3>
        <SystemsNetwork />
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#c2410c]">02 / One invoice, two entities</p>
          <h3 className="mb-5 mt-1 text-[26px] font-extrabold leading-tight sm:text-[32px]">The routine path runs. The exception waits for a person.</h3>
          <InvoiceRun />
        </div>
        <div>
          <p className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#c2410c]">03 / The write back</p>
          <h3 className="mb-5 mt-1 text-[26px] font-extrabold leading-tight sm:text-[32px]">Every post is a diff you can approve.</h3>
          <ActionLedger />
        </div>
      </div>
    </div>
  </section>
}
