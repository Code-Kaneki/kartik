import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Press_Start_2P, VT323 } from 'next/font/google'
import './globals.css'

const pressStart = Press_Start_2P({ weight: '400', subsets: ['latin'], variable: '--font-press-start' })
const vt323 = VT323({ weight: '400', subsets: ['latin'], variable: '--font-vt323' })

export const metadata: Metadata = {
  title: 'Kartik Raj — Dev Quest | Pixel RPG Portfolio',
  description:
    'Explore the pixel-art village of Kartik Raj, a B.Tech CSE student on a quest to become an SDE-2 in Japan. Walk into buildings to discover his profile, projects, roadmap and contact.',
  generator: 'v0.app',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light',
  themeColor: '#e6dcfa',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${pressStart.variable} ${vt323.variable}`}>
      <body className="antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
