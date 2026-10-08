import type { Metadata } from 'next'
import './styles.css'

const description = 'Beag Labs helps teams automate documents, create internal apps and modernize legacy workflows using customer-hosted agentic software.'
const canonical = 'https://www.beaglabs.com/'
const ogImage = 'https://www.beaglabs.com/og?title=Solving%20the%20boring%20problems.&description=Document%20automation%2C%20internal%20apps%20and%20legacy%20modernization&label=Beag%20Labs'

export const metadata: Metadata = {
  metadataBase: new URL('https://beaglabs-web-preview.beag-labs.workers.dev'),
  title: 'Solving the boring problems. — Beag Labs',
  description,
  alternates: { canonical },
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg', apple: '/favicon.svg' },
  manifest: '/manifest.webmanifest',
  openGraph: { title: 'Solving the boring problems. — Beag Labs', description, type: 'website', siteName: 'Beag Labs', url: canonical, locale: 'en_US', images: [{ url: ogImage, width: 1200, height: 630, alt: 'Beag Labs — Solving the boring problems.' }] },
  twitter: { card: 'summary_large_image', title: 'Solving the boring problems. — Beag Labs', description, images: [ogImage] },
}

const organizationSchema = {
  '@context': 'https://schema.org', '@type': 'Organization', name: 'Beag Labs',
  url: canonical, logo: 'https://www.beaglabs.com/favicon.png',
  description, knowsAbout: ['AI document automation', 'Agentic internal app development', 'Legacy system modernization', 'SOAP/XML to OpenAPI', 'Customer-hosted artificial intelligence'],
}
const websiteSchema = {
  '@context': 'https://schema.org', '@type': 'WebSite', name: 'Beag Labs',
  url: canonical, description, publisher: { '@type': 'Organization', name: 'Beag Labs' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Roboto+Condensed:wght@700;800;900&family=Work+Sans:wght@400;500;600;700;800;900&display=swap" />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationSchema, websiteSchema]) }} />
  </head><body>{children}</body></html>
}
