"use client"

import dynamic from 'next/dynamic'

const OrderLifecycleManager = dynamic(
  () => import('@/components/licensing/order-lifecycle-manager').then((module) => module.OrderLifecycleManager),
  {
    ssr: false,
    loading: () => null,
  },
)

const LicensingConsole = dynamic(
  () => import('@/components/licensing/licensing-console').then((module) => module.LicensingConsole),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[520px] items-center justify-center">
        <div className="nb-panel px-7 py-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em]">
          Loading licensing administration
        </div>
      </div>
    ),
  },
)

export function LicensingPageClient() {
  return (
    <>
      <OrderLifecycleManager />
      <LicensingConsole />
    </>
  )
}
