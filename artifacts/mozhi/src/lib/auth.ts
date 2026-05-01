

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = typeof window !== 'undefined' 
  ? (import.meta.env.VITE_SUPABASE_URL || '')
  : (import.meta.env.VITE_SUPABASE_URL || '')

const supabaseAnonKey = typeof window !== 'undefined'
  ? (import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  : (import.meta.env.VITE_SUPABASE_ANON_KEY || '')

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export async function signInWithEmail(email: string, password: string) {
  if (!isConfigured) {
    return { error: 'Supabase not configured' }
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      return { error: error.message }
    }
    
    return { data }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function signUpWithEmail(email: string, password: string, fullName: string, role: string) {
  if (!isConfigured) {
    return { error: 'Supabase not configured' }
  }
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })
    
    if (authError) {
      return { error: authError.message }
    }
    
    return { data: authData }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function signOut() {
  if (!isConfigured) {
    return { error: undefined }
  }
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  if (!isConfigured) {
    return { session: null, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export async function onAuthStateChange(callback: (event: string, session: any) => void) {
  if (!isConfigured) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}

export async function getUser() {
  if (!isConfigured) {
    return { user: null, error: 'Supabase not configured' }
  }
  const { data, error } = await supabase.auth.getUser()
  return { user: data.user, error }
}