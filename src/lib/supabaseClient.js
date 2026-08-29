import { createClient } from '@supabase/supabase-js'

// Majmui Shaadi is built to run against a real Supabase project.
// Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to a .env file
// (see .env.example) and connect it to a project created from
// supabase/schema.sql to switch from demo mode to a live database.
//
// Until those variables are present the app runs entirely on an
// in-browser demo store (see src/lib/db.js) so the prototype works
// out of the box with zero setup.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
