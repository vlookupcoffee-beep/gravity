
// scripts/debug_schema_reports.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function inspectSchema() {
    // Check columns for daily_reports
    console.log("--- daily_reports columns ---")
    // We can't query information_schema easily with anon key usually, 
    // but we can select one row and look at keys if RLS allows.
    const { data: report } = await supabase.from('daily_reports').select('*').limit(1)
    if (report && report.length) console.log(Object.keys(report[0]))
    else console.log("No access or empty daily_reports")

    // Check for potential child tables
    const potentialTables = ['daily_report_items', 'report_items', 'daily_report_details']

    for (const table of potentialTables) {
        console.log(`\n--- checking ${table} ---`)
        const { data, error } = await supabase.from(table).select('*').limit(1)
        if (error) console.log(`Error/Not Found: ${error.message}`)
        else {
            console.log("Found!")
            if (data.length) console.log(Object.keys(data[0]))
        }
    }
}

inspectSchema()
