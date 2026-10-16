import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal-page-shell"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Papyrus Terms of Service",
  description: "The terms under which Beag Labs provides Papyrus, including payments through your bank, Stripe and Plaid.",
  path: "/papyrus/terms",
  label: "Legal",
})

/* Version 2026-10-16. Papyrus records this version when an organization accepts; change it (and PAPYRUS_TERMS_VERSION's default) with any revision. */
export default function PapyrusTermsPage() {
  return (
    <LegalPageShell
      eyebrow="Papyrus"
      title="Papyrus Terms of Service"
      updatedAt="October 16, 2026"
      intro="These terms govern your organization's use of Papyrus, the software Beag Labs licenses for agent operations, records, workflows and payments. The person who accepts them in Papyrus accepts them on the organization's behalf."
    >

      <section>
        <h2>1. Agreement and precedence</h2>
        <p>These terms are an agreement between Beag Labs (&ldquo;Beag Labs&rdquo;, &ldquo;we&rdquo;) and the organization that deploys Papyrus (&ldquo;you&rdquo;). If you have a signed agreement, contract, task order, purchase order or other procurement instrument with Beag Labs or an authorized reseller that covers Papyrus, that agreement controls where it conflicts with these terms. Nothing here overrides law that applies to a government customer.</p>
      </section>

      <section>
        <h2>2. The license</h2>
        <p>Beag Labs grants you a non-exclusive, non-transferable license to install and use Papyrus for your organization's internal operations during the term of your license or Azure Marketplace subscription, within the deployments, profiles and features your license names. You may not resell Papyrus, provide it to third parties as a service, or circumvent its license checks.</p>
      </section>

      <section>
        <h2>3. Your deployment and your data</h2>
        <p>Papyrus runs on infrastructure you control. Your records, documents, conversations, payee details and payment files are stored in your deployment, and you remain their owner and controller. You decide who can use Papyrus through your Microsoft Entra tenant and the roles you assign. You are responsible for your users, their access, your infrastructure, backups and the content you put into Papyrus.</p>
      </section>

      <section>
        <h2>4. Payments</h2>
        <ul>
          <li><strong>Your bank moves your money.</strong> Payments out are made by your bank from bank files you approve and send. Your organization is the originator under your agreement with your bank and the Nacha Operating Rules, and remains responsible for authorizations, the accuracy of payee details, and compliance with those rules. Papyrus workflows prepare the files and record who approved them; Papyrus does not hold, transmit or have custody of your funds.</li>
          <li><strong>Card and bank payments from the public</strong> are processed by Stripe on your organization's own Stripe account, under the <a href="https://stripe.com/legal/ssa">Stripe Services Agreement</a> between your organization and Stripe. Papyrus connects to that account only as you authorize it (through Stripe's own sign-in and the webhooks you set up). Stripe, not Beag Labs, processes those payments and pays them out to your bank.</li>
          <li><strong>Bank account details</strong> may be collected through Plaid when a payee or your staff chooses to connect a bank. Plaid's use of that information is governed by the <a href="https://plaid.com/legal/#end-user-privacy-policy">Plaid End User Privacy Policy</a>.</li>
          <li><strong>Controls are yours to use.</strong> Papyrus provides approvals, sanctions screening, name checks and other controls for your workflows, and requires an approval before any workflow step that moves money. You decide how to configure and staff them, and remain responsible for the payments you approve. Sanctions screening and name checks are aids, not guarantees.</li>
        </ul>
      </section>

      <section>
        <h2>5. Fees</h2>
        <p>Papyrus fees, including any fee for its payment features, are set by your license, Marketplace plan or agreement. Beag Labs takes no fee from the payments your organization makes or receives.</p>
      </section>

      <section>
        <h2>6. Beag Labs services</h2>
        <p>Some features use services Beag Labs operates, including licensing, provisioning and the service that reads payees' bank details through Plaid. These services receive only what they need to work, described in the Papyrus Privacy Policy. We may change or improve them; we will not reduce their core function during your term without notice.</p>
      </section>

      <section>
        <h2>7. Agents and automation</h2>
        <p>Papyrus includes AI agents and workflows that act within the permissions you grant. Agents can draft and suggest but cannot approve payments or move money. Outputs from AI models can be wrong; you are responsible for reviewing agent work before relying on it for decisions that affect people or money.</p>
      </section>

      <section>
        <h2>8. Acceptable use</h2>
        <p>You will not use Papyrus to break the law, to process payments for unlawful purposes, to evade sanctions, to attack other systems, or to process data you have no right to process.</p>
      </section>

      <section>
        <h2>9. Security and support</h2>
        <p>Beag Labs follows reasonable security practices in building Papyrus and its services, and provides updates through the Papyrus updater. Support is provided as described in your license or agreement. Report security issues through beaglabs.com/trust.</p>
      </section>

      <section>
        <h2>10. Warranties and liability</h2>
        <p>Except as stated in your agreement, Papyrus and Beag Labs services are provided &ldquo;as is&rdquo;. To the extent the law allows, Beag Labs is not liable for indirect or consequential damages, or for losses from payments your organization approves, and its total liability is limited to the fees you paid Beag Labs in the twelve months before the claim. These limits do not apply where the law does not allow them.</p>
      </section>

      <section>
        <h2>11. Term and ending</h2>
        <p>These terms apply while you use Papyrus. When your license ends you may keep your data, which stays in your deployment. Sections that by their nature should survive, including fees owed, liability and data ownership, survive.</p>
      </section>

      <section>
        <h2>12. Changes and governing law</h2>
        <p>We may update these terms; Papyrus will ask your organization to accept a new version before continuing. These terms are governed by the laws of the United States and the State of Delaware, except where a government customer's applicable law requires otherwise. Questions: <a href="mailto:legal@beaglabs.com">legal@beaglabs.com</a>.</p>
      </section>
    </LegalPageShell>
  )
}
