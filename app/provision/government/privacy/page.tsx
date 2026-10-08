import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Government Provisioning Privacy Notice',
    description: 'Privacy and data handling notice for the Papyrus government provisioning control plane.',
    path: '/provision/government/privacy',
    label: 'Legal',
  }),
  robots: { index: false, follow: false },
}

export default function GovernmentProvisioningPrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Papyrus / Government"
      title="Government Provisioning Privacy & Data Handling Notice"
      updatedAt="October 7, 2026"
      intro="The connected government provisioning portal is designed to process only the minimum identity, licensing, agreement, and Azure resource metadata needed to administer Papyrus deployments."
    >
      <section>
        <h2>1. Connected metadata</h2>
        <p>For connected deployments, Beag Labs may process Microsoft Entra tenant and user identifiers, organization name, Azure subscription/resource identifiers, VM name, size and region, Papyrus deployment ID, Marketplace plan metadata when applicable, signed-license metadata, provisioning status, and agreement acceptance/audit records.</p>
      </section>
      <section>
        <h2>2. Prohibited workload content</h2>
        <p>The provisioning portal is not intended to receive classified information, CUI, controlled technical information, mission data, Papyrus prompts or conversations, customer documents, credentials, model inputs or outputs, or enclave workload data. Do not upload or paste such material into the website.</p>
      </section>
      <section>
        <h2>3. Disconnected environments</h2>
        <p>Disconnected Papyrus deployments can validate signed licenses locally. Beag Labs does not require telemetry, a licensing callback, or workload-data transfer from a disconnected environment for local license verification.</p>
      </section>
      <section>
        <h2>4. Azure management authorization</h2>
        <p>When an authorized operator requests a connected Azure management action, the portal may temporarily hold a delegated Azure Resource Manager token. Tokens are encrypted in the portal session store, constrained by the operator's existing Azure permissions, used only for requested deployment operations, and expire according to Microsoft's token lifetime.</p>
      </section>
      <section>
        <h2>5. Offline license records</h2>
        <p>The control plane may retain license ID, organization/deployment scope, signing key identifier, checksum, issue and expiration dates, status, and the signed license document so authorized operators can retrieve the artifact for approved transfer.</p>
      </section>
      <section>
        <h2>6. Audit and retention</h2>
        <p>Provisioning and agreement records may be retained to support contract administration, security review, audit, licensing history, troubleshooting, and legal obligations. Retention of government records remains subject to the applicable controlling agreement and law.</p>
      </section>
      <section>
        <h2>7. Contact</h2>
        <p>Questions about government provisioning data handling may be sent to privacy@beaglabs.com.</p>
      </section>
    </LegalPageShell>
  )
}
