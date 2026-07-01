/** Canonical site URL — production'da custom domain (Vercel redirect fix) */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured

  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return 'http://localhost:3000'
}

/** OAuth redirectTo için canonical origin — env yoksa request host */
export function getOAuthRedirectOrigin(request: Request): string {
  const { origin: requestOrigin } = new URL(request.url)

  // Lokal: npm run dev -p 3004 gibi farklı portta SITE_URL (3000) callback'i kaçırmasın
  if (process.env.NODE_ENV === 'development') {
    return requestOrigin
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured
  return resolveAuthRedirectOrigin(request)
}

/** OAuth callback sonrası doğru domain'e yönlendirme */
export function resolveAuthRedirectOrigin(request: Request): string {
  const { origin: requestOrigin } = new URL(request.url)

  if (process.env.NODE_ENV === 'development') {
    return requestOrigin
  }

  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '')
  if (configured) return configured

  const forwardedHost = request.headers.get('x-forwarded-host')
  if (forwardedHost) {
    const protocol = request.headers.get('x-forwarded-proto') ?? 'https'
    return `${protocol}://${forwardedHost.split(',')[0].trim()}`
  }

  return requestOrigin
}
