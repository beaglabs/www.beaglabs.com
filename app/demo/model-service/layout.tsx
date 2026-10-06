import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Model Training Demo',
    description: 'Explore the Beag Labs model training workflow, from datasets to review and export.',
    path: '/demo/model-service',
    label: 'Demo',
  }),
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
