import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Sign in',
    description: 'Sign in to your Beag Labs workspace.',
    path: '/login',
    label: 'Workspace',
  }),
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
