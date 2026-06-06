// Re‑export the singleton Supabase client for convenient imports.
// This file simply forwards the export from `supabaseClient.ts` so that
// components can use a shorter import path:
//   import { supabase } from '@/lib/supabase'
export { supabase } from './supabaseClient'