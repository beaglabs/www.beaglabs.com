'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Bot,
  Workflow,
  Puzzle,
  Plug,
  MessageSquare,
  Clock,
  BarChart3,
  Settings,
  LayoutDashboard,
  Zap,
  LogOut,
} from 'lucide-react'

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    title: 'Agents',
    href: '/agents',
    icon: Bot,
  },
  {
    title: 'Workflows',
    href: '/workflows',
    icon: Workflow,
  },
  {
    title: 'Skills',
    href: '/skills',
    icon: Puzzle,
  },
  {
    title: 'MCP Servers',
    href: '/mcp',
    icon: Plug,
  },
  {
    title: 'Channels',
    href: '/channels',
    icon: MessageSquare,
  },
  {
    title: 'Schedules',
    href: '/schedules',
    icon: Clock,
  },
  {
    title: 'Observability',
    href: '/observability',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
]

export function SidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.push('/login')
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r-3 border-black bg-[var(--sidebar)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b-3 border-black">
        <div className="w-9 h-9 bg-[var(--accent)] border-2 border-black flex items-center justify-center">
          <Zap className="w-5 h-5 text-black" />
        </div>
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            Beag Labs
          </div>
          <div className="font-bold text-sm">Agent Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-link flex items-center gap-3 px-3 py-2.5 text-sm font-medium border-2 border-transparent',
                isActive && 'active nb-label !px-3 !py-2.5 !text-sm !shadow-none !border-2 !border-black'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 px-5 py-4 border-t-3 border-black space-y-2">
        <div className="nb-chip text-xs w-full justify-center">
          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2" />
          Flue Runtime Connected
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors w-full justify-center py-2"
        >
          <LogOut className="w-3 h-3" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
