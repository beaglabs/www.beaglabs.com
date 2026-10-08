import type { Metadata } from 'next'
import './styles.css'

export const metadata: Metadata = {
  title: 'Beag Labs — Solving the boring problems',
  description: 'Automate documents, create internal apps and modernize legacy workflows with customer-hosted AI.',
  alternates: { canonical: 'https://www.beaglabs.com/' },
  robots: { index: false, follow: false },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>
}
