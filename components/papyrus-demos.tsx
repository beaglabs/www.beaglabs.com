import { ApprovalCanvas } from '@/components/demos/approval-canvas'
import { ActionLedger } from '@/components/demos/action-ledger'
import { ClassInspector } from '@/components/demos/class-inspector'
import { DeployTerminal } from '@/components/demos/deploy-terminal'

const Intro = ({ n, title, copy }: { n: string; title: string; copy: string }) => <div className="mb-5 max-w-[760px]">
  <p className="font-mono text-[11px] font-bold uppercase tracking-[.14em] text-[#c2410c]">{n}</p>
  <h3 className="mt-1 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[32px]">{title}</h3>
  <p className="mt-2 text-[15px] leading-7 text-[#333]">{copy}</p>
</div>

/** Papyrus, shown working: workflows, the action ledger, Classes and deployment. */
export function PapyrusDemos() {
  return <section id="see-it-work" className="site-hero border-b-[3px] border-[#111] px-6 py-20 lg:px-9">
    <div className="mx-auto max-w-[1200px] space-y-20">
      <div>
        <span className="nb-label mb-5 inline-block">See it work</span>
        <h2 className="display-black max-w-[900px] text-[length:min(40px,9vw)] leading-[.95] sm:text-[60px]">Every part of the harness, live.</h2>
        <p className="mt-5 max-w-[720px] border-l-[3px] border-[#ff5f1f] bg-white pl-4 text-[16px] leading-7">These are working demos on sample data. Click through them: edit a policy in plain English, approve an agent's write, inspect a Class, and watch a deployment come up.</p>
      </div>

      <div>
        <Intro n="01 / Workflows" title="Policies you can read, edited in plain English." copy="Approval rules become a canvas of steps with quorums, amount conditions and SLAs. Ask for a change and Papyrus proposes it as a diff; a lint catches unassigned seats and missing controls before anything goes live." />
        <ApprovalCanvas />
      </div>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <Intro n="02 / Action ledger" title="Agents propose. People approve." copy="Every write to a system of record arrives as a field-level diff with the agent's reasoning. Approval releases it to an executor and adds it to a hash-chained record." />
          <ActionLedger />
        </div>
        <div>
          <Intro n="03 / Classes" title="One record, every system." copy="Classes are your own record types. Each one maps to the source records that hold it, so agents and people work with one Vendor instead of four." />
          <ClassInspector />
        </div>
      </div>

      <div>
        <Intro n="04 / Deployment" title="One codebase. Three ways to run it." copy="Commercial teams deploy from papyrus.beaglabs.com in minutes. Government cloud and DoD installs run the same build inside your boundary, with offline licensing and no callback to us." />
        <DeployTerminal />
      </div>
    </div>
  </section>
}
