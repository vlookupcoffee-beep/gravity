
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
    // defaults to process.env.NEXT_PUBLIC_SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY
    // We explicitly pass them to be sure.
    // NOTE: Application must handle authorization logic!
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // Fallback to Anon if Service Role missing (will fail RLS if any)

    return createSupabaseClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    })
}
