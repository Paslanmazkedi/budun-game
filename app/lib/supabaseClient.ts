import { createClient } from '@supabase/supabase-js'

// The Supabase URL and anon key are expected to be provided via environment
// variables. In a Next.js project these are typically prefixed with
// NEXT_PUBLIC_ so they are exposed to the browser. The non-null assertion
// (`!`) is safe here because the environment variables are required for the
// application to function correctly.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * A singleton Supabase client instance that can be imported anywhere in the
 * application. Using a single instance avoids creating multiple connections
 * and keeps the client configuration in one place.
 */
// Export the singleton client so it can be imported from any module.
// The file name `supabaseClient.ts` is a bit verbose for imports, so we
// also provide a lightweight re‑export file `supabase.ts` that simply
// re‑exports this instance. This allows components to use a shorter
// import path: `import { supabase } from '@/lib/supabase'`.
export const supabase = createClient(supabaseUrl, supabaseKey)
