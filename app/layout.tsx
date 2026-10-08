import type { Metadata } from 'next'
import { Work_Sans, JetBrains_Mono, Roboto_Condensed } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsentBanner, PosthogConsentGate } from '@/components/cookie-consent-banner'
import { Toaster } from '@/components/ui/sonner'
import { ogImageUrl } from '@/lib/seo'
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
  'Beag Labs helps teams automate documents, create internal apps and modernize legacy workflows with customer-hosted agentic software.'

const homeOgImage = ogImageUrl({
  title: 'Solving the boring problems.',
  description: homeDescription,
  label: 'Document Automation · Internal Apps · Modernization',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.beaglabs.com'),
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
    title: 'Solving the boring problems. — Beag Labs',
    description: homeDescription,
    url: 'https://www.beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: homeOgImage,
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Solving the boring problems.',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Solving the boring problems. — Beag Labs',
    description: homeDescription,
    images: [homeOgImage],
    creator: '@beaglabs',
  },
}

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Beag Labs',
  url: 'https://www.beaglabs.com',
  description: homeDescription,
  publisher: { '@type': 'Organization', name: 'Beag Labs' },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Beag Labs',
  url: 'https://www.beaglabs.com',
  logo: 'https://www.beaglabs.com/favicon-demo.svg',
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
        className={`${workSans.variable} ${jetbrainsMono.variable} ${robotoCondensed.variable} font-sans antialiased bg-background text-foreground`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify([organizationJsonLd, websiteJsonLd]) }}
        />
        <PosthogConsentGate />
        {children}
        <CookieConsentBanner />
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
