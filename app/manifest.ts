import type { MetadataRoute } from 'next'

/** PWA ikon: public/images/icons/pwaicon.png (512×512 önerilir) */
const PWA_ICON = '/images/icons/pwaicon.png'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Budun Online',
    short_name: 'Budun',
    description: 'Bozkırda Kadim Bir RPG Deneyimi',
    start_url: '/',
    display: 'standalone',
    background_color: '#0c0a09',
    theme_color: '#0c0a09',
    lang: 'tr',
    icons: [
      {
        src: PWA_ICON,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: PWA_ICON,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: PWA_ICON,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
