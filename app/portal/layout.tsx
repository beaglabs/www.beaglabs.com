import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { decryptSession } from '@/lib/discord-session-edge'
import { cookies } from 'next/headers'
import { Navbar } from '@/components/navbar'
import { SiteFooter } from '@/components/site-footer'

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

  if (!sessionCookie) {
    redirect('/api/auth/discord')
  }

  const session = await decryptSession(sessionCookie.value)
  if (!session) {
    redirect('/api/auth/discord')
  }

  const avatarUrl = session?.avatar
    ? `https://cdn.discordapp.com/avatars/${session.userId}/${session.avatar}.png?size=64`
    : null

  return (
    <div className="min-h-screen bg-[#FAFAF9] text-[#111]">
      <Navbar />

      <div className="mx-auto flex max-w-[1440px] pt-16">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 border-r-[3px] border-[#111] bg-[#FAFAF9] p-4 min-h-[calc(100vh-4rem)]">
          {/* User badge */}
          <div className="mb-6 flex items-center gap-2 border-b-[3px] border-[#111] pb-4">
            {avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="w-6 h-6 border-2 border-[#111]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-[#111]">{session?.globalName || session?.username}</p>
            </div>
            <Link href="/api/auth/discord/logout" className="text-[10px] font-mono uppercase tracking-wider text-[#999] hover:text-[#FF5F1F] transition-colors">
              Logout
            </Link>
          </div>

          <nav className="space-y-6">
            {navSections.map((section) => (
              <div key={section.label}>
                <p className="nb-label text-[9px] mb-2">
                  {section.label}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="block px-2 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[#555] hover:text-[#111] hover:bg-[#FF5F1F]/10 border-l-[3px] border-transparent hover:border-[#FF5F1F] transition-all"
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
        <main className="flex-1 p-6 min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>

      <SiteFooter />
    </div>
  )
}
