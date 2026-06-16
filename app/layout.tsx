import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Budun Online',
  description: 'Bozkırda Kadim Bir RPG Deneyimi',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Budun',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0c0a09',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-stone-950 text-stone-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  )
}
