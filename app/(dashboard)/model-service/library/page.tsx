import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Model Library',
    description: 'Browse trained models and reusable training assets in your workspace.',
    path: '/model-service/library',
    label: 'Training',
  }),
}

import { LibraryPage } from "./library-page";

export const dynamic = "force-dynamic";

export default function LibraryServerPage() {
  return <LibraryPage />;
}
