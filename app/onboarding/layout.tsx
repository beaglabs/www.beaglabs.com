import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Workspace Onboarding',
    description: 'Set up your workspace and prepare data for domain-specific model training.',
    path: '/onboarding',
    label: 'Workspace',
  }),
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
