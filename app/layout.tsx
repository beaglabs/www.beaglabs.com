import type { Metadata } from 'next'
import { JetBrains_Mono, IBM_Plex_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono'
});
const ibmPlexMono = IBM_Plex_Mono({ 
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans'
});

export const metadata: Metadata = {
  title: 'Gardens - MLS Encrypted Messaging for Communities',
  description: 'Secure, encrypted messaging for affinity groups. Built with Message Layer Security (MLS) for end-to-end encrypted group conversations.',
  generator: 'v0.app',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Gardens - MLS Encrypted Messaging for Communities',
    description: 'Secure, encrypted messaging for affinity groups. Built with Message Layer Security (MLS) for end-to-end encrypted group conversations.',
    images: [
      {
        url: '/og-image.png',
        width: 1456,
        height: 816,
        alt: 'Gardens - MLS Encrypted Messaging for Communities',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gardens - MLS Encrypted Messaging for Communities',
    description: 'Secure, encrypted messaging for affinity groups. Built with Message Layer Security (MLS) for end-to-end encrypted group conversations.',
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
      <body className={`${ibmPlexMono.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
