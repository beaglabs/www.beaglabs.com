import type { Metadata } from 'next'
import { pageMetadata } from '@/lib/seo'

export const metadata: Metadata = {
  ...pageMetadata({
    title: 'Training Settings',
    description: 'Configure organization settings and model training preferences.',
    path: '/model-service/settings',
    label: 'Training',
  }),
}

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-[17px] font-semibold text-[#1a1714] tracking-[-0.03em] mb-2">Settings</h1>
      <p className="text-sm text-[#8f7a68]">Configure your organization and training preferences.</p>
      <div className="mt-8 rounded-xl border border-dashed border-[#e2c9a6] bg-[#fffaf3] p-12 text-center">
        <p className="text-[15px] text-[#8f7a68]">Settings management coming soon.</p>
      </div>
    </div>
  );
}
