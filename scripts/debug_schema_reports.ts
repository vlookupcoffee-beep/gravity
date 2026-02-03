
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function inspectSchema() {
    console.log("--- Inspecting daily_reports ---")
    const { data, error } = await supabase.from('daily_reports').select('*').limit(1)

    if (error) {
        console.error("Error:", error.message)
        return
    }

    if (data && data.length > 0) {
        const row = data[0]
        console.log('Columns:', Object.keys(row))
        console.log('Sample Row:', JSON.stringify(row, null, 2))
    } else {
        console.log("No rows found in daily_reports")
    }
}

inspectSchema()
