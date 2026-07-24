import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import Script from 'next/script'
import { Analytics } from '@vercel/analytics/next'
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
    default: 'Beag Labs — Purpose-Built AI. Your Data. Your Infrastructure.',
  },
  description:
    'Domain-specific classification and extraction models trained on your proprietary data. Deploy on-prem, air-gapped, or in your VPC. No APIs. No data leakage. You own the model.',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Beag Labs — Purpose-Built AI. Your Data. Your Infrastructure.',
    description:
      'Domain-specific classification and extraction models trained on your proprietary data. Deploy on-prem, air-gapped, or in your VPC. No APIs. No data leakage. You own the model.',
    url: 'https://www.beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Domain AI, Deployed Anywhere',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beag Labs — Purpose-Built AI. Your Data. Your Infrastructure.',
    description:
      'Domain-specific classification and extraction models trained on your proprietary data. Deploy on-prem, air-gapped, or in your VPC. No APIs. No data leakage. You own the model.',
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
    'Small Model Foundry. Domain-specific classification and extraction models trained on your proprietary data. Deploy on-prem, air-gapped, or in your VPC.',
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
      <head>
        <Script
          id="Cookiebot"
          src="https://consent.cookiebot.com/uc.js"
          data-cbid="bad980ff-2e66-4542-bb27-fafa08d70ba2"
          data-blockingmode="auto"
          type="text/javascript"
          strategy="beforeInteractive"
        />
      </head>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
