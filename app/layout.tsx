import type { Metadata, Viewport } from 'next'
import { Share_Tech_Mono, Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })
const shareTechMono = Share_Tech_Mono({
  variable: '--font-share-tech-mono',
  weight: '400',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CCTV MONITOR — SURVEILLANCE SYSTEM v2.1',
  description: 'Retro 90s CCTV surveillance grid monitor with multi-camera support',
  generator: 'v0.app',
}

export const viewport: Viewport = {
  themeColor: '#030a06',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${shareTechMono.variable} bg-background`}
    >
      <body className="bg-background text-foreground overflow-hidden">
        {children}
      </body>
    </html>
  )
}
