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
  variable: '--font-work-sans',
  weight: ['300', '400', '500', '600', '700', '800'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
})

const robotoCondensed = Roboto_Condensed({
  subsets: ['latin'],
  variable: '--font-roboto-condensed',
  weight: ['700', '800', '900'],
})

const homeDescription =
  'Beag Labs helps teams automate documents, create internal apps and modernize legacy workflows with customer-hosted agentic software.'

const homeOgImage = 'https://beaglabs.com/og?variant=home&v=2026-10-12-sled-federal-v2'

export const metadata: Metadata = {
  metadataBase: new URL('https://beaglabs.com'),
  title: {
    template: '%s — Beag Labs',
    default: 'Beag Labs — Document Automation, Internal Apps & Modernization',
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
    title: 'Agentic Solutions for SLED and Federal — Beag Labs',
    description: homeDescription,
    url: 'https://beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: homeOgImage,
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Agentic Solutions for SLED and Federal',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Agentic Solutions for SLED and Federal — Beag Labs',
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
      <head>
        {/* The same three families by plain stylesheet: the Cloudflare (vinext) build doesn't run next/font. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700;800&family=Roboto+Condensed:wght@700;800;900&family=Work+Sans:wght@300;400;500;600;700;800&display=swap" />
      </head>
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
