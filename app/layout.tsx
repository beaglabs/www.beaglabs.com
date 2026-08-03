import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Playfair_Display, EB_Garamond } from 'next/font/google'
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
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-display',
  weight: ['400', '700', '900'],
  style: ['normal', 'italic'],
});
const garamond = EB_Garamond({
  subsets: ["latin"],
  variable: '--font-serif',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
});

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
    title: 'Beag Labs — Small models for government and high-trust industries. Deployable anywhere.',
    description:
      'Small models for government and high-trust industries. Deployable anywhere.',
    url: 'https://www.beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Small models deployed anywhere',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beag Labs — Small models for government and high-trust industries. Deployable anywhere.',
    description:
      'Small models for government and high-trust industries. Deployable anywhere.',
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
        <body className={`${inter.variable} ${jetbrainsMono.variable} ${playfair.variable} ${garamond.variable} font-sans antialiased bg-background text-foreground`}>
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
