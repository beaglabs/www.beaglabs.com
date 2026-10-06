import { pageMetadata } from '@/lib/seo'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Marketplace Partners',
    description: 'Beag Labs commercial transactions are handled through Microsoft Marketplace.',
    path: '/partners/login',
    label: 'Partners',
  }),
  robots: { index: false, follow: false },
}

export default function PartnerLoginPage() {
  redirect('/partners/portal')
}
