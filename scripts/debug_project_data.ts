
// scripts/debug_project_data.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debugProject() {
    const projectId = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315' // ID found previously

    console.log(`Debugging Project: ${projectId}`)

    // 1. Check POW Tasks
    const { count: taskCount, error: taskError } = await supabase
        .from('pow_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    if (taskError) console.error("POW Tasks Error:", taskError.message)
    else console.log(`POW Tasks Count: ${taskCount}`)

    // 2. Check Project Materials
    const { count: matCount, error: matError } = await supabase
        .from('project_materials')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    if (matError) console.error("Project Materials Error:", matError.message)
    else console.log(`Project Materials Count: ${matCount}`)

    // 3. Check Materials Table (General access)
    const { count: allMatCount, error: allMatError } = await supabase
        .from('materials')
        .select('*', { count: 'exact', head: true })

    if (allMatError) console.error("Materials Access Error:", allMatError.message)
    else console.log(`Total Materials in DB: ${allMatCount}`)
}

debugProject()
