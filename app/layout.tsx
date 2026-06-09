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
  title: 'Beag Labs — Applied AI Research',
  description: 'Applied AI research lab and consulting studio. We advance the frontier of artificial intelligence through dataset generation, fine-tuning, robotics, and model curation.',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Beag Labs — Applied AI Research',
    description: 'Applied AI research lab and consulting studio. We advance the frontier of artificial intelligence through dataset generation, fine-tuning, robotics, and model curation.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased bg-white text-[#0a0a0a]`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
