import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Commercial Provisioning Terms',
    description: 'Commercial terms for the Papyrus customer provisioning and deployment control plane.',
    path: '/provision/commercial/terms',
    label: 'Legal',
  }),
  robots: { index: false, follow: false },
}

export default function CommercialProvisioningTermsPage() {
  return (
    <LegalPageShell
      eyebrow="Papyrus / Commercial"
      title="Commercial Provisioning Terms"
      updatedAt="October 7, 2026"
      intro="These terms govern use of the Beag Labs Papyrus provisioning control plane for commercial Azure deployments. Marketplace purchase terms, an applicable private offer, order form, or other written agreement may add to or replace portions of these terms."
    >
      <section>
        <h2>1. Authority and acceptance</h2>
        <p>By accepting these terms, you represent that you are authorized to act for the organization associated with the Microsoft Entra tenant used to sign in and to administer the Azure resources you connect to Papyrus.</p>
      </section>
      <section>
        <h2>2. Customer-hosted deployment</h2>
        <p>Papyrus is deployed into infrastructure controlled by the customer. Except for the provisioning metadata described in the accompanying privacy notice, application data, prompts, documents, credentials, model traffic, and workload content remain in the customer-controlled environment unless the customer intentionally connects an external service.</p>
      </section>
      <section>
        <h2>3. Azure Marketplace billing</h2>
        <p>For usage-based Marketplace plans, Microsoft is the billing system of record. Beag Labs may display mirrored usage and estimated Papyrus software charges for convenience, but Microsoft billing records control. Azure infrastructure, networking, storage, model, and other Microsoft charges are separate from Papyrus software charges.</p>
      </section>
      <section>
        <h2>4. Deployment operations</h2>
        <p>The provisioning portal may perform Azure management actions that you explicitly request, including VM resize operations. Such actions can restart, deallocate, or otherwise interrupt a VM. You are responsible for reviewing the selected operation, capacity, cost, backup posture, maintenance window, and Azure subscription limits before confirming it.</p>
      </section>
      <section>
        <h2>5. Account and identity security</h2>
        <p>You are responsible for protecting Microsoft Entra accounts, Azure roles, application registrations, secrets, and other credentials used with Papyrus. Beag Labs may require reauthentication before sensitive deployment operations and may refuse an operation when required Azure permissions cannot be verified.</p>
      </section>
      <section>
        <h2>6. Software use</h2>
        <p>You may use Papyrus only under the plan, entitlement, term, and deployment rights acquired for your organization. You may not bypass Marketplace metering, disable license enforcement, misrepresent deployment identity, or use an offline license to override the commercial rights of a Marketplace deployment.</p>
      </section>
      <section>
        <h2>7. Availability and support</h2>
        <p>The customer controls the Azure environment in which Papyrus runs. Beag Labs does not guarantee availability of Azure VM families, regional capacity, third-party model endpoints, customer identity services, or other infrastructure outside Beag Labs control. Support contacts and any assigned Account Manager are shown in the provisioning portal.</p>
      </section>
      <section>
        <h2>8. Contract hierarchy</h2>
        <p>If these terms conflict with an executed private offer, order form, master agreement, Marketplace Standard Contract amendment, or other written agreement signed by authorized representatives of both parties, that controlling written agreement prevails to the extent of the conflict.</p>
      </section>
      <section>
        <h2>9. Contact</h2>
        <p>Questions about these terms may be sent to legal@beaglabs.com.</p>
      </section>
    </LegalPageShell>
  )
}
