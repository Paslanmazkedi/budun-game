/** Supabase project URL — sondaki /rest/v1 veya / kaldırılır (Vercel env hatasına karşı) */
export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? ''
  return raw.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '')
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? ''
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey())
}
