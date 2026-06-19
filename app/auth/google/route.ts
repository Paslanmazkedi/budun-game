import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { isSupabaseConfigured, getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'
import { getOAuthRedirectOrigin } from '@/lib/site-url'

/** Google OAuth — sunucuda başlatılır; client bundle'da apikey olmasa bile çalışır */
export async function GET(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL('/login?error=supabase_config', request.url))
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const origin = getOAuthRedirectOrigin(request)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback?next=/characters`,
    },
  })

  if (error || !data.url) {
    console.error('[auth/google]', error?.message ?? 'OAuth URL missing')
    return NextResponse.redirect(new URL('/login?error=oauth_start', request.url))
  }

  return NextResponse.redirect(data.url)
}
