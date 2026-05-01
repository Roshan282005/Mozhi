import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key'

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin Supabase client — only use server-side (never expose the key client-side)
// In this Vite/client-only app, falls back to anon key for safety
export function createServerSupabaseClient() {
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Browser client for client-side rendering
export function createBrowserSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}
