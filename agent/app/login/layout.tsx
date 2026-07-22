import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In — Beag Labs Agent Portal',
  description: 'Sign in to access the agent portal',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
