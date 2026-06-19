import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { resolveAuthRedirectOrigin } from '@/lib/site-url'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase-config'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/characters'

  if (!next.startsWith('/')) {
    next = '/'
  }

  if (code) {
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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      console.error('[auth/callback]', error.message)
      return NextResponse.redirect(new URL('/login?error=oauth_callback', request.url))
    }
  }

  const origin = resolveAuthRedirectOrigin(request)
  return NextResponse.redirect(new URL(next, origin))
}
