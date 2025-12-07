'use server'

import { createClient } from '@/utils/supabase/server'

export async function getKHSProviders() {
    const supabase = await createClient()

    // Check if table exists first/handle error gracefully
    const { data, error } = await supabase
        .from('khs_providers')
        .select(`
            *,
            items:khs_items(count)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching providers:', error)
        return []
    }

    return data
}
