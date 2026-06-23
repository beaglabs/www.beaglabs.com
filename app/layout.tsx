import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { GleapProvider } from '@/components/gleap-provider'
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
  title: 'Beag Labs — Applied AI Research',
  description: 'Applied AI research lab and consulting studio. We advance the frontier of artificial intelligence through dataset generation, fine-tuning, robotics, and model curation.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Beag Labs — Applied AI Research',
    description: 'Applied AI research lab and consulting studio. We advance the frontier of artificial intelligence through dataset generation, fine-tuning, robotics, and model curation.',
    url: 'https://beaglabs.com',
    siteName: 'Beag Labs',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Beag Labs — Applied AI Research',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Beag Labs — Applied AI Research',
    description: 'Applied AI research lab and consulting studio.',
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
        <GleapProvider>
          {children}
        </GleapProvider>
        <Analytics />
      </body>
    </html>
  )
}
