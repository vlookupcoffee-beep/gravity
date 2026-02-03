
// scripts/debug_reports.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function debugReports() {
    const projectId = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315'

    console.log(`Checking Reports for Project: ${projectId}`)

    // 1. Get POW Tasks Status
    const { data: tasks } = await supabase
        .from('pow_tasks')
        .select('task_name, progress, status')
        .eq('project_id', projectId)

    console.log("\nCurrent POW Tasks:")
    tasks?.forEach(t => console.log(` - ${t.task_name}: ${t.progress}% (${t.status})`))

    // 2. Get Daily Reports Count
    const { count: reportCount } = await supabase
        .from('daily_reports')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)

    console.log(`\nTotal Daily Reports: ${reportCount}`)

    // 3. Sample Report Content
    const { data: reports } = await supabase
        .from('daily_reports')
        .select('date, today_activity, status')
        .eq('project_id', projectId)
        .limit(5)
        .order('date', { ascending: false })

    console.log("\nRecent Reports:")
    reports?.forEach(r => console.log(` - ${r.date}: ${r.today_activity?.substring(0, 50)}... [${r.status}]`))
}

debugReports()
