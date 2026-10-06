import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Create a Training Run',
    description: 'Configure a new domain-specific model training run with your data.',
    path: '/model-service/runs/create',
    label: 'Training',
  }),
}

import { CreateRunPage } from "./create-run-page";

export const dynamic = "force-dynamic";

export default function CreateRunServerPage() {
  return <CreateRunPage />;
}
