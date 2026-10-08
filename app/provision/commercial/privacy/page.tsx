import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Commercial Provisioning Privacy Notice',
    description: 'Privacy notice for the Papyrus commercial provisioning control plane.',
    path: '/provision/commercial/privacy',
    label: 'Legal',
  }),
  robots: { index: false, follow: false },
}

export default function CommercialProvisioningPrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Papyrus / Commercial"
      title="Provisioning Privacy Notice"
      updatedAt="October 7, 2026"
      intro="This notice describes the limited account and deployment metadata processed by Beag Labs when you use the connected Papyrus commercial provisioning portal."
    >
      <section>
        <h2>1. Information processed</h2>
        <p>We process the Microsoft Entra tenant ID and immutable user object ID used to authenticate, the user name and email Microsoft supplies, organization information you provide, Azure resource identifiers for Papyrus deployments, VM size and region, Marketplace publisher/product/plan metadata, provisioning status, agreement acceptance records, and Papyrus-related Marketplace usage records made available to Beag Labs.</p>
      </section>
      <section>
        <h2>2. Workload data is not collected by provisioning</h2>
        <p>The provisioning control plane is not intended to receive Papyrus conversations, prompts, documents, generated applications, customer credentials, model inputs or outputs, or other workload content. Those remain in the customer-hosted Papyrus environment unless the customer separately chooses to transmit them.</p>
      </section>
      <section>
        <h2>3. Azure access tokens</h2>
        <p>When you authorize an Azure management operation, the portal may temporarily hold a delegated Azure Resource Manager token. Tokens are encrypted at rest in the control-plane session store, used only for verified deployment operations requested through the portal, and expire with the Microsoft-issued token/session. Beag Labs does not use these tokens to perform unrelated Azure administration.</p>
      </section>
      <section>
        <h2>4. Billing metadata</h2>
        <p>Beag Labs may mirror Papyrus Marketplace usage and estimated charges obtained through Microsoft Partner Center so they can be shown in the customer portal. Microsoft remains the billing and invoice system of record.</p>
      </section>
      <section>
        <h2>5. Agreement and audit records</h2>
        <p>We retain records of agreement version, acceptance time, accepting identity, source IP, user agent, deployment actions, and related audit events to operate the service, investigate security issues, and maintain commercial records.</p>
      </section>
      <section>
        <h2>6. Account Manager information</h2>
        <p>The portal may display the name, business email, title, avatar, and booking link of the Beag Labs Account Manager assigned to your organization.</p>
      </section>
      <section>
        <h2>7. Retention and security</h2>
        <p>Provisioning records are retained only as needed to administer active or historical deployments, licensing, billing support, security, audit, and legal obligations. Beag Labs applies access controls and reasonable technical safeguards to this control-plane data.</p>
      </section>
      <section>
        <h2>8. Contact</h2>
        <p>Privacy questions may be sent to privacy@beaglabs.com.</p>
      </section>
    </LegalPageShell>
  )
}
