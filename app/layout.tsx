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
  'We develop tools and infrastructure aligned with frameworks like NIST AI RMF to help high-trust organizations get commercial-level agent capabilities on their own infrastructure.'

const homeOgImage = ogImageUrl({
  title: 'Mission-Ready Agentic Dominance',
  description: homeDescription,
  label: 'Custom AI. On Your Infra.',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.beaglabs.com'),
  title: {
    template: '%s — Beag Labs',
    default: 'Beag Labs — Small models for government and high-trust industries. Deployable anywhere.',
  },
  description:
    'Small models for government and high-trust industries. Deployable anywhere.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Mission-Ready Agentic Dominance — Beag Labs',
    description: homeDescription,
    url: 'https://www.beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: homeOgImage,
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Mission-Ready Agentic Dominance',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mission-Ready Agentic Dominance — Beag Labs',
    description: homeDescription,
    images: [homeOgImage],
    creator: '@beaglabs',
  },
}

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Beag Labs',
  url: 'https://www.beaglabs.com',
  logo: 'https://www.beaglabs.com/favicon.png',
  description:
    'Small models for government and high-trust industries. Deployable anywhere.',
  sameAs: ['https://x.com/beaglabs'],
  knowsAbout: [
    'Small language models',
    'Domain-specific AI',
    'On-premises AI deployment',
    'Fine-tuning',
    'Data labeling',
    'Model distillation',
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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
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
