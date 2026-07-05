import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigError =
  !supabaseUrl || !supabaseKey
    ? 'Environment variable VITE_SUPABASE_URL atau VITE_SUPABASE_ANON_KEY belum diset di Vercel.'
    : null

// Use placeholder values if missing so createClient doesn't throw and crash the whole app.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder'
)
