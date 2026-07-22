'use client'

import { usePathname } from 'next/navigation'
import { SidebarNav } from '@/components/sidebar-nav'

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/login'

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <>
      <SidebarNav />
      <main className="ml-64 min-h-screen">
        <div className="p-8">{children}</div>
      </main>
    </>
  )
}
