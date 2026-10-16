import type { Metadata } from "next"
import { LegalPageShell } from "@/components/legal-page-shell"
import { pageMetadata } from "@/lib/seo"

export const metadata: Metadata = pageMetadata({
  title: "Papyrus Privacy Policy",
  description: "What Papyrus keeps on your deployment, what Beag Labs receives, and the services involved in payments.",
  path: "/papyrus/privacy",
  label: "Legal",
})

/* Version 2026-10-16. Papyrus records this version when an organization accepts; change it (and PAPYRUS_PRIVACY_VERSION's default) with any revision. */
export default function PapyrusPrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Papyrus"
      title="Papyrus Privacy Policy"
      updatedAt="October 16, 2026"
      intro="Papyrus runs on infrastructure your organization controls, so most information never reaches Beag Labs. This policy explains what stays with you, the limited information Beag Labs receives, and the services involved when Papyrus handles payments."
    >

      <section>
        <h2>1. What stays on your deployment</h2>
        <p>Your organization's records, documents, conversations, workflows, ledger, payments, payee details and bank statements are stored in your Papyrus deployment. Your organization controls that information and decides how long to keep it. Bank account numbers needed for bank files are stored encrypted and shown only as their last four digits. Beag Labs does not have access to your deployment unless you grant it, for example for support.</p>
      </section>

      <section>
        <h2>2. What Beag Labs receives</h2>
        <ul>
          <li><strong>Licensing and provisioning:</strong> your organization's name, Microsoft Entra tenant identifier, deployment identifier, license and plan details, Azure resource details for Marketplace deployments, and the record of who accepted these terms and when.</li>
          <li><strong>The payments service</strong> (which connects your deployment to Stripe and Plaid): your deployment's identity and public address, your Stripe account identifier and status, payment event details needed to post to your ledger (amounts, references, statuses, the funds they belong to), and a log of which deployment asked for what. Bank account details read through Plaid pass through this service once to your deployment and are not stored by Beag Labs.</li>
          <li><strong>Updates:</strong> your deployment's version, to offer updates.</li>
        </ul>
        <p>Beag Labs uses this information to provide and secure Papyrus, administer licenses and billing, and meet legal obligations. We do not sell it.</p>
      </section>

      <section>
        <h2>3. Services involved in payments</h2>
        <ul>
          <li><strong>Stripe</strong> processes card and bank payments made to your organization through your own Stripe account, and the Papyrus Payments subscription. See the <a href="https://stripe.com/privacy">Stripe Privacy Policy</a>.</li>
          <li><strong>Plaid</strong> collects bank account details when someone chooses to connect a bank. See the <a href="https://plaid.com/legal/#end-user-privacy-policy">Plaid End User Privacy Policy</a>.</li>
          <li><strong>Microsoft Azure</strong> (Key Vault, and Marketplace for Marketplace deployments), <strong>Cloudflare</strong> (hosting the payments service) and <strong>Turso</strong> (its database) host parts of the Beag Labs services.</li>
          <li><strong>Your bank</strong> receives the payment files you send and returns statements; that relationship is between your organization and your bank.</li>
        </ul>
      </section>

      <section>
        <h2>4. People who pay or are paid by your organization</h2>
        <p>Residents, vendors and others who pay your organization, or whom it pays, provide information to your organization, which controls it. Questions about that information should go to your organization. Payment pages and bank-detail links show only what is needed for that payment or request.</p>
      </section>

      <section>
        <h2>5. Retention and security</h2>
        <p>Beag Labs keeps licensing, provisioning, agreement and payments-service records for as long as needed to provide the service, administer contracts, meet audit and legal obligations, and resolve disputes. Secrets are held in Azure Key Vault; access to Beag Labs systems is limited and logged.</p>
      </section>

      <section>
        <h2>6. Your choices and contact</h2>
        <p>Your organization can choose not to use Papyrus Payments, Stripe or Plaid. To ask about, correct or delete information Beag Labs holds, contact <a href="mailto:privacy@beaglabs.com">privacy@beaglabs.com</a>. Government customers' rights are also governed by their controlling agreement and applicable law.</p>
      </section>

      <section>
        <h2>7. Changes</h2>
        <p>We may update this policy; Papyrus will ask your organization to accept a new version before continuing.</p>
      </section>
    </LegalPageShell>
  )
}
