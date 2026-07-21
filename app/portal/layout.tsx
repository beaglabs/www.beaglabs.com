import type { Metadata } from 'next'
import Link from 'next/link'
import { decryptSession } from '@/lib/discord-oauth'
import { cookies } from 'next/headers'

export const metadata: Metadata = {
  title: 'Portal — Beag Labs',
  description: 'Agent workflow management portal.',
  robots: { index: false, follow: false },
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/portal' },
    ],
  },
  {
    label: 'Agents',
    items: [
      { label: 'All Agents', href: '/portal/agents' },
      { label: 'Workflows', href: '/portal/workflows' },
      { label: 'Runs', href: '/portal/runs' },
    ],
  },
  {
    label: 'Configure',
    items: [
      { label: 'Skills', href: '/portal/skills' },
      { label: 'MCP Servers', href: '/portal/mcp' },
      { label: 'Credentials', href: '/portal/credentials' },
    ],
  },
  {
    label: 'Channels',
    items: [
      { label: 'Discord & Resend', href: '/portal/channels' },
      { label: 'Sandboxes', href: '/portal/sandboxes' },
    ],
  },
]

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('discord-session')
  const session = sessionCookie ? decryptSession(sessionCookie.value) : null

  const avatarUrl = session?.avatar
    ? `https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png?size=64`
    : null

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5]">
      {/* Top bar */}
      <header className="border-b border-[#1a1a1a] bg-[#0d0d0d]">
        <div className="flex items-center justify-between px-6 h-12">
          <div className="flex items-center gap-3">
            <Link href="/portal" className="font-mono text-xs font-bold tracking-widest text-[#C7661D] uppercase">
              Beag Portal
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="text-xs text-[#666]">{session?.globalName || session?.username}</span>
            <Link href="/api/auth/discord/logout" className="text-xs text-[#555] hover:text-[#999] transition-colors">
              Logout
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 min-h-[calc(100vh-3rem)] border-r border-[#1a1a1a] bg-[#0d0d0d] p-4">
          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#444] mb-2">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-2 py-1.5 text-xs text-[#888] hover:text-[#e5e5e5] hover:bg-[#151515] rounded transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 min-h-[calc(100vh-3rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
