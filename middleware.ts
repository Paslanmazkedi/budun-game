import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // The request object is read‑only; we only need to set cookies on the response.
          // Remove the invalid request.cookies.set call and directly set cookies on the response.
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  // Supabase bazen Site URL'e (?code=...) döner — /auth/callback'e yönlendir
  const oauthCode = request.nextUrl.searchParams.get('code')
  if (oauthCode && pathname !== '/auth/callback') {
    const callback = request.nextUrl.clone()
    callback.pathname = '/auth/callback'
    callback.searchParams.set('code', oauthCode)
    if (!callback.searchParams.has('next')) {
      callback.searchParams.set('next', '/characters')
    }
    return NextResponse.redirect(callback)
  }

  // PWA manifest ve ikonlar girişsiz erişilebilir olmalı (Ana ekrana ekle)
  if (
    pathname === '/manifest.webmanifest' ||
    pathname === '/icon' ||
    pathname === '/apple-icon'
  ) {
    return response
  }

  // Giriş yapmamışsa login/auth dışındaki sayfalara erişimi engelle
  if (!session && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Giriş yapmışsa login sayfasından karakter seçimine yönlendir
  if (session && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/characters', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|images|file.svg|globe.svg|next.svg|vercel.svg|window.svg).*)',
  ],
}