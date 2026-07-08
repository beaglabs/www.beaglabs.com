import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
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
  metadataBase: new URL('https://beaglabs.com'),
  title: 'Beag Labs — Classification & Extraction Models, Deployed on Your Infrastructure',
  description: 'Train classification, extraction, and relevance models on your proprietary data. Deploy on-prem or air-gapped. You own the model.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Beag Labs — Classification & Extraction Models, Deployed on Your Infrastructure',
    description: 'Train classification, extraction, and relevance models on your proprietary data. Deploy on-prem or air-gapped. You own the model.',
    url: 'https://beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Custom AI Models',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beag Labs — Classification & Extraction Models, Deployed on Your Infrastructure',
    description: 'Train classification, extraction, and relevance models on your proprietary data. Deploy on-prem or air-gapped. You own the model.',
    images: ['/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
