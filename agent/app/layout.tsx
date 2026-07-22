import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { SidebarNav } from '@/components/sidebar-nav'
import { Toaster } from 'sonner'
import { LayoutWrapper } from '@/components/layout-wrapper'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.beaglabs.com'),
  title: {
    template: '%s — Beag Labs Agent Portal',
    default: 'Agent Portal — Beag Labs',
  },
  description:
    'Manage AI agents, workflows, skills, and integrations. Built on the Flue framework.',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        <LayoutWrapper>{children}</LayoutWrapper>
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
