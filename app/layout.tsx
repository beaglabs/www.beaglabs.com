import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { CookieConsentBanner, PosthogConsentGate } from '@/components/cookie-consent-banner'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-sans'
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: '--font-mono'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.beaglabs.com'),
  title: {
    template: '%s — Beag Labs',
    default: 'Beag Labs — Custom AI. Your Data. Your Infrastructure.',
  },
  description:
    'Custom AI services — we build and deploy domain-specific classification and extraction models on your infrastructure. On-prem, air-gapped, or VPC. You own the model.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Beag Labs — Custom AI. Your Data. Your Infrastructure.',
    description:
      'Custom AI services — we build and deploy domain-specific classification and extraction models on your infrastructure. On-prem, air-gapped, or VPC. You own the model.',
    url: 'https://www.beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Custom AI Deployed Anywhere',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beag Labs — Custom AI. Your Data. Your Infrastructure.',
    description:
      'Custom AI services — we build and deploy domain-specific classification and extraction models on your infrastructure. On-prem, air-gapped, or VPC. You own the model.',
    images: ['/og-image.png'],
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
    'Custom AI services. Domain-specific classification and extraction models deployed on your infrastructure — on-prem, air-gapped, or in your VPC.',
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
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}>
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
