import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  // ÖNEMLİ: Hangi ortamda olduğunu belirle
  const next = searchParams.get('next') ?? '/'
  const isDevelopment = process.env.NODE_ENV === 'development'
  const baseURL = isDevelopment 
    ? 'http://localhost:3003' 
    : 'https://budun-game.vercel.app'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Artık otomatik algılanan 'origin' yerine sabit baseURL kullanıyoruz
  return NextResponse.redirect(new URL(next, baseURL))
}