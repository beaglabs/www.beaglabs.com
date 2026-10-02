import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Marketplace Partners',
  description: 'Beag Labs commercial transactions are handled through Microsoft Marketplace.',
  robots: { index: false, follow: false },
}

export default function PartnerInvitePage() {
  redirect('/partners/portal')
}
