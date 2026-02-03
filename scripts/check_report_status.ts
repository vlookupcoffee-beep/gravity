
// scripts/check_report_status.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkReportStatus() {
    const projectId = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315'

    console.log("=== CHECKING REPORT STATUS ===\n")

    // 1. Get all reports for project
    const { data: reports } = await supabase
        .from('daily_reports')
        .select('id, report_date, status')
        .eq('project_id', projectId)
        .order('report_date', { ascending: false })

    console.log(`Total Reports: ${reports?.length || 0}`)

    // 2. Group by status
    const statusCounts = new Map()
    reports?.forEach(r => {
        const status = r.status || 'null'
        statusCounts.set(status, (statusCounts.get(status) || 0) + 1)
    })

    console.log("\nStatus Breakdown:")
    statusCounts.forEach((count, status) => {
        console.log(`  ${status}: ${count}`)
    })

    // 3. Check report items for ANY report
    if (reports && reports.length > 0) {
        const sampleReportId = reports[0].id
        const { data: items } = await supabase
            .from('daily_report_items')
            .select('*')
            .eq('report_id', sampleReportId)

        console.log(`\nSample Report (${reports[0].report_date}, status: ${reports[0].status}):`)
        console.log(`  Items: ${items?.length || 0}`)

        if (items && items.length > 0) {
            console.log("\n  Sample Items:")
            items.slice(0, 3).forEach(item => {
                console.log(`    - ${item.material_name_snapshot}: ${item.quantity_today}`)
            })
        }
    }

    // 4. Get ALL report items regardless of status
    const { data: allItems } = await supabase
        .from('daily_report_items')
        .select(`
            material_id,
            quantity_today,
            material_name_snapshot,
            daily_reports!inner(status, project_id)
        `)
        .eq('daily_reports.project_id', projectId)

    console.log(`\nTotal Report Items (All Status): ${allItems?.length || 0}`)

    if (allItems && allItems.length > 0) {
        // Aggregate by material
        const materialMap = new Map()
        allItems.forEach(item => {
            const name = item.material_name_snapshot
            const qty = item.quantity_today || 0
            materialMap.set(name, (materialMap.get(name) || 0) + qty)
        })

        console.log("\nAggregated Volumes (All Reports):")
        materialMap.forEach((qty, name) => {
            console.log(`  ${name}: ${qty}`)
        })
    }
}

checkReportStatus()
