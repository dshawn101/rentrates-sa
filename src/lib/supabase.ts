import { createClient } from '@supabase/supabase-js'
import { getSupabaseConfigError } from './supabase-config'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()
export const supabaseConfigError = getSupabaseConfigError(supabaseUrl, supabaseAnonKey, import.meta.env.PROD)

// Keep imports renderable so auth pages can explain missing configuration.
// AuthProvider blocks all auth requests when configuration is invalid.
export const supabase = createClient(
  supabaseConfigError ? 'http://localhost:54321' : supabaseUrl,
  supabaseConfigError ? 'public-anon-key' : supabaseAnonKey,
  { auth: { persistSession: !supabaseConfigError, autoRefreshToken: !supabaseConfigError, detectSessionInUrl: !supabaseConfigError } }
)

// Helper for generic API errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase Error:', error)
  return error?.message || 'An unexpected error occurred with the database.'
}
