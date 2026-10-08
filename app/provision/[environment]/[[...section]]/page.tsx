import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { ProvisionConsole } from '@/components/provision/provision-console'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Papyrus Control Plane',
    description: 'Provision and manage customer-hosted Papyrus deployments.',
    path: '/provision',
    label: 'Provisioning',
  }),
  robots: { index: false, follow: false },
}

export default async function ProvisionEnvironmentPage({
  params,
}: {
  params: Promise<{ environment: string; section?: string[] }>
}) {
  const resolved = await params
  if (resolved.environment !== 'commercial' && resolved.environment !== 'government') notFound()
  const section = resolved.section?.[0] ?? 'deployments'
  return <ProvisionConsole environment={resolved.environment} initialSection={section} />
}
