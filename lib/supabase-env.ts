/** NEXT_PUBLIC_* build zamanında gömülür — Vercel'de tanımlı değilse production'da boş kalır */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  )
}
