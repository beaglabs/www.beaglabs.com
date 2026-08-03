import { auth } from "@/lib/auth-server"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import Link from "next/link"
import type { Metadata } from "next"
import { SignOutButton } from "./sign-out-button"
import { OrgPicker } from "./org-picker"

export const metadata: Metadata = {
  title: "Model Training",
  description: "Train domain-specific models on your data.",
  robots: { index: false, follow: false },
}

const navItems = [
  { label: "Runs", href: "/model-service/runs" },
  { label: "Library", href: "/model-service/library" },
  { label: "Settings", href: "/model-service/settings" },
]

export default async function ModelServiceLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect("/login")
  }

  if (!session.session?.activeOrganizationId) {
    const orgs = await auth.api.listOrganizations({
      headers: await headers(),
    })

    if (orgs.length === 0) {
      redirect("/onboarding")
    }

    return (
      <div className="min-h-screen bg-[#F5F4F0]">
        <header className="border-b border-[#E2E0DB] bg-white">
          <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base font-bold tracking-[-0.04em] text-[#111]">B_</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[#6B6B6B]">Model Training</span>
            </div>
            <span className="text-sm text-[#777]">{session.user.name || session.user.email}</span>
          </div>
        </header>
        <OrgPicker firstOrgId={orgs[0].id} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F4F0]">
      <header className="border-b border-[#E2E0DB] bg-white">
        <div className="max-w-[1440px] mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/model-service/runs" className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#ff5f1f]">
              Beag Model Training
            </Link>
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-[#555] hover:text-[#111] transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#777]">{session.user.name || session.user.email}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="max-w-[1440px] mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
