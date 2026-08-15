import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jqmlubzjqrfezsrtlrzh.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_3V9uKeNdvJTHzTLRvEjw_g_ILviPt3Q'

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
