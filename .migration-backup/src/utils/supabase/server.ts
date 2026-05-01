'use server'

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

export function createClient(): SupabaseClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  )
}