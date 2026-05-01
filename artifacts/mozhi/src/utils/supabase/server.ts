

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

export function createClient(): SupabaseClient {
  return createSupabaseClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
  )
}