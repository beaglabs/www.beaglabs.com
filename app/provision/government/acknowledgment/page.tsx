import type { Metadata } from 'next'
import { LegalPageShell } from '@/components/legal-page-shell'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Government Deployment Acknowledgment',
    description: 'Deployment acknowledgment for connected and offline government Papyrus environments.',
    path: '/provision/government/acknowledgment',
    label: 'Legal',
  }),
  robots: { index: false, follow: false },
}

export default function GovernmentAcknowledgmentPage() {
  return (
    <LegalPageShell
      eyebrow="Papyrus / Government"
      title="Government Deployment Acknowledgment"
      updatedAt="October 7, 2026"
      intro="This acknowledgment governs the operational use of the Papyrus provisioning portal. It does not create procurement authority and does not supersede an applicable government contract, task order, purchase order, OTA, license, or other controlling agreement."
    >
      <section>
        <h2>1. No modification of controlling agreement</h2>
        <p>The applicable contract, task order, purchase order, OTA, license agreement, or other authorized procurement instrument controls the Government's rights and obligations. Nothing accepted through this portal is intended to alter mandatory federal law, regulation, sovereign rights, or the authority of a duly authorized Contracting Officer.</p>
      </section>
      <section>
        <h2>2. Operator authority</h2>
        <p>By continuing, the operator represents only that they are authorized to administer the identified Microsoft tenant or Papyrus deployment and to perform the requested technical operation. Portal acceptance is not a representation that the operator possesses procurement or contracting authority.</p>
      </section>
      <section>
        <h2>3. Connected deployment responsibilities</h2>
        <p>For connected Azure Government deployments, the customer retains control of the Azure subscription, networking, identity, data, model endpoints, security configuration, backup, monitoring, and accreditation boundary. The portal performs only the Azure operations explicitly requested by an authorized user.</p>
      </section>
      <section>
        <h2>4. Disconnected and offline licensing</h2>
        <p>Signed offline licenses may be transferred into approved disconnected environments. Local license verification does not require a callback to Beag Labs. The customer is responsible for approved media-transfer procedures, enclave handling rules, system time integrity, and replacement of licenses before expiration.</p>
      </section>
      <section>
        <h2>5. Sensitive information</h2>
        <p>Do not submit classified information, CUI, export-controlled technical data, operational mission data, credentials, or other restricted workload content to the Beag Labs provisioning website. The portal is intended for deployment identity, account, agreement, licensing, and limited infrastructure metadata only.</p>
      </section>
      <section>
        <h2>6. Security and authorization</h2>
        <p>The operator is responsible for ensuring that requested deployment actions are consistent with the system authorization boundary, change-management process, security controls, and the applicable contract or program direction.</p>
      </section>
      <section>
        <h2>7. Support</h2>
        <p>The provisioning portal may display the Beag Labs Account Manager assigned to the organization. Technical or contractual support should follow the communication and escalation paths established by the controlling agreement.</p>
      </section>
      <section>
        <h2>8. Contact</h2>
        <p>Questions about government deployment terms may be sent to legal@beaglabs.com.</p>
      </section>
    </LegalPageShell>
  )
}
