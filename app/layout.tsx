import type { Metadata } from 'next'
import './globals.css' // Eğer globals.css yolun burasıysa aynen kalsın

export const metadata: Metadata = {
  title: 'Budun Online',
  description: 'Bozkırda Kadim Bir RPG Deneyimi',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className="bg-stone-950 text-stone-100 antialiased">
        {children}
      </body>
    </html>
  )
}