import type { Metadata, Viewport } from 'next'
import './globals.css'
import ActiveCharacterSync from '@/components/ActiveCharacterSync'
import { PWA_ICON } from '@/lib/game-assets'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL('https://budunonline.com.tr'),
  title: 'Budun Online',
  description: 'Bozkırda Kadim Bir RPG Deneyimi',
  icons: {
    icon: PWA_ICON,
    apple: PWA_ICON,
  },
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
        <ActiveCharacterSync />
        {children}
      </body>
    </html>
  )
}
