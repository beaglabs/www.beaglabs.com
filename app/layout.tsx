import type { Metadata } from 'next'
import { Work_Sans, JetBrains_Mono, Roboto_Condensed } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Navbar } from '@/components/navbar'
import { CookieConsentBanner, PosthogConsentGate } from '@/components/cookie-consent-banner'
import { CustomerIoPageViews } from '@/components/customerio-page-views'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const workSans = Work_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['700', '800', '900'],
})

const homeDescription =
  'Papyrus is the agentic ERP from Beag Labs: a data model that understands your business, agents that run your back office, and approvals where they matter. Try Papyrus now.'

const homeOgImage = 'https://beaglabs.com/og?variant=home&v=2026-10-18-superintelligent-erp'

export const metadata: Metadata = {
  metadataBase: new URL('https://beaglabs.com'),
  title: {
    template: '%s — Beag Labs',
    default: 'Papyrus by Beag Labs — Building the Superintelligent ERP',
  },
  description:
    homeDescription,
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [{ url: '/favicon-demo.svg', type: 'image/svg+xml' }, { url: '/favicon.png', type: 'image/png' }],
    shortcut: '/favicon-demo.svg',
    apple: '/apple-icon.png',
  },
  applicationName: 'Beag Labs',
  manifest: '/manifest.webmanifest',
  openGraph: {
    title: 'Building the Superintelligent ERP — Papyrus by Beag Labs',
    description: homeDescription,
    url: 'https://beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: homeOgImage,
        width: 1200,
        height: 630,
        alt: 'Papyrus by Beag Labs — Building the Superintelligent ERP',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Building the Superintelligent ERP — Papyrus by Beag Labs',
    description: homeDescription,
    images: [homeOgImage],
    creator: '@beaglabs',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Beag Labs',
  url: 'https://beaglabs.com',
  description: homeDescription,
  publisher: { '@type': 'Organization', name: 'Beag Labs' },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Beag Labs',
  url: 'https://beaglabs.com',
  logo: 'https://beaglabs.com/favicon-demo.svg',
  description: homeDescription,
  sameAs: ['https://x.com/beaglabs'],
  knowsAbout: [
    'AI document automation',
    'Agentic internal app factory',
    'Agentic legacy modernization',
    'COBOL and mainframe modernization',
    'SOAP/XML to OpenAPI integration',
    'Customer-hosted agentic software',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${workSans.variable} ${jetbrainsMono.variable} ${robotoCondensed.variable} font-sans antialiased bg-background text-foreground pt-[67px]`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd]) }}
        />
        <PosthogConsentGate />
        <CustomerIoPageViews />
        <Navbar />
        {children}
        <CookieConsentBanner />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
