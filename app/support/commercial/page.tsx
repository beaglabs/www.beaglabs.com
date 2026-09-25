import type { Metadata } from 'next'

import { SupportDetailPage } from '@/components/support-detail-page'
import { pageMetadata } from '@/lib/seo'

const SUPPORT_EMAIL = 'commercial@beaglabs.com'

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({
    title: 'Commercial support',
    description:
      'Support for Papyrus commercial deployments: channels, response targets by severity, what is in scope, and what to include when you report an issue.',
    path: '/support/commercial',
    label: 'Support',
    images: [
      {
        url: 'https://images.pexels.com/photos/39081904/pexels-photo-39081904.png',
        width: 2047,
        height: 1167,
        alt: 'Commercial deployment workspace',
      },
    ],
  })
}

const SEVERITIES = [
  {
    level: 'Severity 1',
    definition: 'The appliance is down or unusable in production, no workaround exists, and work has stopped.',
    firstResponse: '4 business hours',
    updates: 'Every business day until resolved',
  },
  {
    level: 'Severity 2',
    definition: 'Functionality is degraded or a subset of workflows fails, but a workaround is available.',
    firstResponse: '1 business day',
    updates: 'Every 2 business days until resolved',
  },
  {
    level: 'Severity 3',
    definition: 'Questions, configuration help, documentation gaps, cosmetic defects, and feature requests.',
    firstResponse: '3 business days',
    updates: 'As the request progresses',
  },
]

const DIAGNOSTICS: Array<[string, string]> = [
  ['Deployment ID', 'Shown on the appliance onboarding page and returned by /api/config/public. It is the identifier we use to find the licence record.'],
  ['Image tag', 'The Papyrus image tag you deployed, for example 0.1.1. `sudo docker ps --format "{{.Image}}"` prints it.'],
  ['Environment', 'Cloud or on-premises environment, region where applicable, VM or host size, and the deployment method you used.'],
  ['Container state', '`sudo docker ps -a` and `sudo docker logs papyrus --tail 200`.'],
  ['Timeline', 'When it last worked and what changed immediately before the issue — image update, network policy, model endpoint rotation, or host change.'],
  ['Expected vs. observed', 'What you expected Papyrus to do, what actually happened, and the smallest reproducible sequence you can provide.'],
]

const IN_SCOPE = [
  'The Papyrus container image, API, and first-run onboarding.',
  'Azure Resource Manager templates and Bicep modules in our repository, including deployment failures.',
  'Licence issuance, activation, renewal, and deployment-ID questions.',
  'Model endpoint configuration for Azure OpenAI, OpenAI-compatible gateways, and customer-hosted inference endpoints.',
  'Upgrades between published image tags and rollback guidance.',
]

const OUT_OF_SCOPE = [
  'Cloud-provider incidents, quota limits, region capacity, or outages in third-party infrastructure.',
  'Customer-managed network, firewall, DNS, private endpoint, identity, and egress policy issues unless separately scoped.',
  'Availability or correctness of a customer-hosted or third-party model endpoint.',
  'Custom integrations, connectors, prompts, or implementation work created during a professional-services engagement.',
  'Host operating-system administration and hardening beyond what our deployment artifacts apply.',
]

const CONTACT_NOTES = [
  'Business hours are Monday to Friday, 09:00–18:00 US Eastern, excluding US federal holidays.',
  'Severity 1 reports are reviewed outside normal business hours on a best-effort basis. Standard support does not include a 24×7 on-call rotation unless your agreement says otherwise.',
  'Email is the supported channel. Keeping the deployment ID and issue history in one thread gives the engineer handling your case the fastest path to a useful answer.',
]

const SELF_SERVICE = [
  {
    title: 'Azure deployment README',
    detail: 'Parameters, disk layout, deployment steps, and checks that confirm a healthy Papyrus appliance.',
    href: 'https://github.com/beaglabs/papyrus/blob/main/deploy/azure/README.md',
  },
  {
    title: 'GET /api/config/public',
    detail: 'Reports the deployment ID, licence state, and active profile. This resolves many first-run and configuration questions immediately.',
    code: true,
  },
  {
    title: 'GET /api/license/status',
    detail: 'Reports whether the appliance licence is active and when it expires.',
    code: true,
  },
  {
    title: 'sudo docker exec papyrus node /healthcheck.mjs',
    detail: 'Runs the appliance health check and exits non-zero when the sandbox or workspace is unhealthy.',
    code: true,
  },
]

export default function CommercialSupportPage() {
  return (
    <SupportDetailPage
      eyebrow="Papyrus — commercial"
      title="Commercial support"
      intro="Support for self-deployed Papyrus appliances in commercial cloud and on-premises environments. Email reaches the team responsible for the product. If you are running the government offer, use"
      email={SUPPORT_EMAIL}
      mailSubject="Papyrus commercial support request"
      image="https://images.pexels.com/photos/39081904/pexels-photo-39081904.png?auto=compress&cs=tinysrgb&w=1920"
      imageAlt="Commercial deployment workspace"
      counterpart={{ label: 'government support', href: '/support/government' }}
      severities={SEVERITIES}
      diagnostics={DIAGNOSTICS}
      inScope={IN_SCOPE}
      outOfScope={OUT_OF_SCOPE}
      contactNotes={CONTACT_NOTES}
      selfService={SELF_SERVICE}
    />
  )
}
