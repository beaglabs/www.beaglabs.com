import type { Metadata } from 'next'

import { SupportDetailPage } from '@/components/support-detail-page'
import { pageMetadata } from '@/lib/seo'

const SUPPORT_EMAIL = 'government@beaglabs.com'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Government support',
    description:
      'Support for Papyrus government deployments in accredited and disconnected environments: support channels, response targets, scope, diagnostics, and contract-aware escalation.',
    path: '/support/government',
    label: 'Support',
    images: [
      {
        url: 'https://images.pexels.com/photos/4328661/pexels-photo-4328661.jpeg',
        width: 2047,
        height: 1167,
        alt: 'Government deployment workspace',
      },
    ],
  })
}

const SEVERITIES = [
  {
    level: 'Severity 1',
    definition: 'The appliance is down or unusable in production, no workaround exists, and mission-critical work has stopped.',
    firstResponse: '4 business hours',
    updates: 'Every business day until resolved',
  },
  {
    level: 'Severity 2',
    definition: 'Functionality is degraded or a subset of workflows fails, but a workaround remains available.',
    firstResponse: '1 business day',
    updates: 'Every 2 business days until resolved',
  },
  {
    level: 'Severity 3',
    definition: 'Configuration questions, documentation gaps, cosmetic defects, compliance-evidence questions, and feature requests.',
    firstResponse: '3 business days',
    updates: 'As the request progresses',
  },
]

const DIAGNOSTICS: Array<[string, string]> = [
  ['Deployment ID', 'Shown on the appliance onboarding page and returned by /api/config/public. It is the identifier we use to locate the licence record.'],
  ['Image tag', 'The exact Papyrus image tag deployed in the environment, for example 0.1.1.'],
  ['Environment context', 'Cloud, on-premises, disconnected, or enclave context; region where applicable; VM or host size; and the deployment method used.'],
  ['Container state', '`sudo docker ps -a` and `sudo docker logs papyrus --tail 200`, with sensitive values removed before transmission.'],
  ['Timeline', 'When it last worked and what changed immediately before the issue — image update, network policy, identity change, model endpoint rotation, or boundary-policy update.'],
  ['Authorization context', 'If relevant, provide the control, SSP, POA&M, STIG finding, or ATO-package reference tied to the Papyrus component. Do not email CUI or classified material unless your agreement authorizes that channel.'],
]

const IN_SCOPE = [
  'The Papyrus container image, API, and first-run onboarding in government, accredited, and disconnected environments.',
  'Deployment artifacts maintained by Beag Labs, including Azure Government deployment failures attributable to those artifacts.',
  'Licence issuance, activation, renewal, and deployment-ID questions.',
  'Model endpoint configuration for Azure OpenAI, OpenAI-compatible gateways, and customer-hosted inference inside the approved boundary.',
  'Published image upgrades, rollback guidance, and appliance-level troubleshooting.',
  'Papyrus component evidence and documentation used by the customer in RMF, ATO, SSP, POA&M, CMMC, or similar assessment workflows.',
]

const OUT_OF_SCOPE = [
  'Cloud-provider incidents, quota limits, region capacity, or outages in customer-managed infrastructure.',
  'Customer network, firewall, DNS, private endpoint, identity, cross-domain, and egress policies unless separately scoped.',
  'Availability or correctness of customer-hosted or third-party model endpoints.',
  'Custom integrations, connectors, prompts, or mission workflows created under a separate services statement of work.',
  'Operating-system administration, STIG remediation, or platform hardening beyond the Papyrus deployment artifacts unless included in the governing agreement.',
  'Maintenance of an agency authorization package beyond the Papyrus evidence and component artifacts Beag Labs is responsible for providing.',
]

const CONTACT_NOTES = [
  'Business hours are Monday to Friday, 09:00–18:00 US Eastern, excluding US federal holidays, unless the governing contract establishes different coverage.',
  'Severity 1 reports are reviewed outside normal business hours on a best-effort basis. Any 24×7, mission, or incident-response coverage is governed by the applicable order, task order, or support agreement.',
  'If your agreement names a COR, program manager, security officer, prime contractor, or other required point of contact, keep that person on the support thread and follow the communication rules in the agreement.',
  'Do not send CUI, export-controlled data, classified information, credentials, tokens, or production secrets over ordinary email. Send identifiers and sanitized diagnostics first so we can establish the approved exchange path.',
]

const SELF_SERVICE = [
  {
    title: 'Azure deployment README',
    detail: 'Deployment parameters, disk layout, and health checks for Papyrus appliances, including Azure Government deployments where supported.',
    href: 'https://github.com/beaglabs/papyrus/blob/main/deploy/azure/README.md',
  },
  {
    title: 'GET /api/config/public',
    detail: 'Reports the deployment ID, licence state, and active profile without requiring access to a Beag Labs control plane.',
    code: true,
  },
  {
    title: 'GET /api/license/status',
    detail: 'Reports whether the appliance licence is active and when it expires.',
    code: true,
  },
  {
    title: 'sudo docker exec papyrus node /healthcheck.mjs',
    detail: 'Runs the appliance health check. Capture the result inside the approved environment and sanitize it before sending by email.',
    code: true,
  },
]

export default function GovernmentSupportPage() {
  return (
    <SupportDetailPage
      eyebrow="Papyrus — government"
      title="Government support"
      intro="Support for Papyrus appliances deployed in government, accredited, and disconnected environments. Contract-specific terms always control, and the government mailbox keeps those requests separate from commercial support. If you are using the commercial offer, use"
      email={SUPPORT_EMAIL}
      mailSubject="Papyrus government support request"
      image="https://images.pexels.com/photos/4328661/pexels-photo-4328661.jpeg?auto=compress&cs=tinysrgb&w=1920"
      imageAlt="Government deployment workspace"
      counterpart={{ label: 'commercial support', href: '/support/commercial' }}
      severities={SEVERITIES}
      diagnostics={DIAGNOSTICS}
      inScope={IN_SCOPE}
      outOfScope={OUT_OF_SCOPE}
      contactNotes={CONTACT_NOTES}
      selfService={SELF_SERVICE}
    />
  )
}
