import type { CSSProperties } from 'react'

/**
 * Giriş ekranı ayarları — metin ve görsel boyutları buradan düzenlenir.
 * Canlı önizleme: /admin/login-ekrani (giriş yapmış olmanız gerekir)
 */
export const LOGIN_SCREEN_CONFIG = {
  /** Alt yazı — boş string verirseniz gizlenir */
  tagline: 'Otağını kur, kahramanını seç ve bozkır seferlerine çık.',

  /** Google giriş butonu metni */
  googleButtonLabel: 'Google ile Bağlan',

  /** Logo alt metni (erişilebilirlik) */
  logoAlt: 'Budun Online',

  /**
   * Logo boyut ve konum (px)
   * offsetX: negatif = sola, pozitif = sağa
   * offsetY: negatif = yukarı, pozitif = aşağı
   */
  logo: {
    widthMobile: 176,
    heightMobile: 176,
    widthDesktop: 208,
    heightDesktop: 208,
    offsetXMobile: 0,
    offsetYMobile: 0,
    offsetXDesktop: 0,
    offsetYDesktop: 0,
  },

  /** Üst boşluk (mobil) — splash’teki başlıkla çakışmayı önler */
  mobileTopPadding: 'pt-28',

  /** Mobilde loginlogo.png göster (mobilelogin.png zaten marka içeriyorsa false) */
  showLogoOnMobile: false,

  /** Arka plan karartma (0–100) */
  overlayOpacity: 20,

  /** Arka plan görselleri — public/images/backgrounds */
  background: {
    mobile: '/images/backgrounds/mobilelogin.png',
    desktop: '/images/backgrounds/loginsplash.png',
  },
} as const

export type LoginScreenConfig = typeof LOGIN_SCREEN_CONFIG
export type LoginLogoConfig = LoginScreenConfig['logo']

/** Logo sarmalayıcı — CSS değişkenleri (globals.css .login-logo-wrap) */
export function loginLogoCssVars(logo: LoginLogoConfig = LOGIN_SCREEN_CONFIG.logo): CSSProperties {
  return {
    ['--login-logo-w' as string]: `${logo.widthMobile}px`,
    ['--login-logo-h' as string]: `${logo.heightMobile}px`,
    ['--login-logo-x' as string]: `${logo.offsetXMobile}px`,
    ['--login-logo-y' as string]: `${logo.offsetYMobile}px`,
    ['--login-logo-w-sm' as string]: `${logo.widthDesktop}px`,
    ['--login-logo-h-sm' as string]: `${logo.heightDesktop}px`,
    ['--login-logo-x-sm' as string]: `${logo.offsetXDesktop}px`,
    ['--login-logo-y-sm' as string]: `${logo.offsetYDesktop}px`,
  }
}

/** Admin önizleme — mobil logo inline stili */
export function loginLogoPreviewStyle(
  logo: LoginLogoConfig = LOGIN_SCREEN_CONFIG.logo,
  viewport: 'mobile' | 'desktop' = 'mobile'
): CSSProperties {
  const isDesktop = viewport === 'desktop'
  return {
    width: isDesktop ? logo.widthDesktop : logo.widthMobile,
    height: isDesktop ? logo.heightDesktop : logo.heightMobile,
    transform: `translate(${isDesktop ? logo.offsetXDesktop : logo.offsetXMobile}px, ${isDesktop ? logo.offsetYDesktop : logo.offsetYMobile}px)`,
    objectFit: 'contain',
  }
}

export const LOGIN_LOGO_FIELD_LABELS: Record<keyof LoginLogoConfig, string> = {
  widthMobile: 'Genişlik (mobil, px)',
  heightMobile: 'Yükseklik (mobil, px)',
  widthDesktop: 'Genişlik (masaüstü, px)',
  heightDesktop: 'Yükseklik (masaüstü, px)',
  offsetXMobile: 'Yatay kaydırma mobil (px, − sol / + sağ)',
  offsetYMobile: 'Dikey kaydırma mobil (px, − yukarı / + aşağı)',
  offsetXDesktop: 'Yatay kaydırma masaüstü (px)',
  offsetYDesktop: 'Dikey kaydırma masaüstü (px)',
}
