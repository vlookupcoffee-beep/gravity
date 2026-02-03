
// scripts/debug_project_data_v2.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debugProject() {
    const projectId = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315' // ID found previously

    console.log(`Debugging Project: ${projectId}`)

    // 1. Check Project Materials (Correct Table Name: project_material_requirements)
    const { data: materials, error: matError } = await supabase
        .from('project_material_requirements')
        .select(`
            *,
            material:materials(*)
        `)
        .eq('project_id', projectId)

    if (matError) {
        console.error("Requirements Access Error:", matError.message)
    } else {
        console.log(`Requirement Items Found: ${materials?.length}`)
        materials?.forEach(m => console.log(` - ${m.material?.name}: Needed ${m.quantity_needed}`))
    }

    // 2. Check Transactions
    const { count: transCount, error: transError } = await supabase
        .from('material_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    if (transError) console.error("Transactions Error:", transError.message)
    else console.log(`Total Transactions: ${transCount}`)
}

debugProject()
