
// scripts/test_report_sync.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const STATUS_WEIGHT_MAPPING = [
    { name: "DD-BRNG-HDPE", weight: 30, identifiers: ["DD-BRNG-HDPE-40-1"] },
    { name: "HDPE", weight: 10, identifiers: ["HDPE-40-33"] },
    { name: "KABEL", weight: 15, identifiers: ["AC-ADSS-SM-96C", "AC-ADSS-SM-12C", "AC-ADSS-SM-24C", "AC-ADSS-SM-48C", "AC-ADSS-SM-144C"] },
    { name: "ACCESSORIES", weight: 10, identifiers: ["FS-OF-SM", "CO-OF-SM"] },
    { name: "PIT_MH", weight: 10, identifiers: ["MH-PIT-120", "MH-PIT-80"] },
    { name: "TIANG", weight: 15, identifiers: ["NP-7.0-140-3S", "NP-7.0-140-2S", "NP-9.0-140-3S"] }
];

async function testReportSync() {
    const projectId = '28e9e8a2-a3f2-4cdc-9583-8a6b8ae2c315'

    console.log("=== TESTING REPORT-BASED PROGRESS CALCULATION ===\n")

    // 1. Get Requirements
    const { data: requirements } = await supabase
        .from('project_material_requirements')
        .select('material_id, quantity_needed, materials(name)')
        .eq('project_id', projectId)

    // 2. Get Report Items (Approved)
    const { data: reportItems } = await supabase
        .from('daily_report_items')
        .select(`
            material_id,
            quantity_today,
            material_name_snapshot,
            daily_reports!inner(status)
        `)
        .eq('daily_reports.project_id', projectId)
        .eq('daily_reports.status', 'approved')

    console.log(`Requirements Found: ${requirements?.length || 0}`)
    console.log(`Report Items (Approved): ${reportItems?.length || 0}\n`)

    // 3. Aggregate by Material
    const reportVolumeMap = new Map()
    reportItems?.forEach(item => {
        const mid = item.material_id
        const qty = item.quantity_today || 0
        reportVolumeMap.set(mid, (reportVolumeMap.get(mid) || 0) + qty)
    })

    console.log("=== REPORTED VOLUMES ===")
    reportVolumeMap.forEach((qty, mid) => {
        const req = requirements?.find(r => r.material_id === mid)
        const name = req?.materials?.name || 'Unknown'
        console.log(`${name}: ${qty}`)
    })

    // 4. Build Summary (mimicking getProjectMaterialSummary logic)
    const summaryMap = new Map()
    requirements?.forEach(req => {
        const mid = req.material_id
        const name = req.materials?.name || 'Unknown'
        const needed = req.quantity_needed || 0
        const reported = reportVolumeMap.get(mid) || 0

        summaryMap.set(mid, {
            name,
            quantity_needed: needed,
            total_out: reported // Using reported as "total_out"
        })
    })

    // 5. Calculate Weighted Progress
    console.log("\n=== WEIGHTED PROGRESS CALCULATION ===")
    let currentWeightedScore = 0
    let usedMaterialNames = new Set()

    for (const category of STATUS_WEIGHT_MAPPING) {
        const relevantMaterials = Array.from(summaryMap.values()).filter(m =>
            category.identifiers.includes(m.name)
        )

        if (relevantMaterials.length > 0) {
            const totalNeeded = relevantMaterials.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
            const totalOut = relevantMaterials.reduce((acc, m) => acc + (m.total_out || 0), 0)

            const categoryProgress = totalNeeded > 0 ? (totalOut / totalNeeded) : 0
            const contribution = categoryProgress * category.weight

            console.log(`${category.name}: ${(categoryProgress * 100).toFixed(1)}% (${totalOut}/${totalNeeded}) -> +${contribution.toFixed(1)}`)

            currentWeightedScore += contribution
            relevantMaterials.forEach(m => usedMaterialNames.add(m.name))
        } else {
            console.log(`${category.name}: 0% (Tidak ada material)`)
        }
    }

    // Prorata
    const remainingMaterials = Array.from(summaryMap.values()).filter(m => !usedMaterialNames.has(m.name))
    if (remainingMaterials.length > 0) {
        const totalNeeded = remainingMaterials.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
        const totalOut = remainingMaterials.reduce((acc, m) => acc + (m.total_out || 0), 0)
        const prorataProgress = totalNeeded > 0 ? (totalOut / totalNeeded) : 0
        const contribution = prorataProgress * 10
        console.log(`Prorata: ${(prorataProgress * 100).toFixed(1)}% -> +${contribution.toFixed(1)}`)
        currentWeightedScore += contribution
    } else {
        console.log(`Prorata: 100% (Default) -> +10`)
        currentWeightedScore += 10
    }

    const finalScore = Math.min(100, Math.round(currentWeightedScore))
    console.log(`\n✅ SKOR AKHIR BERDASARKAN LAPORAN: ${finalScore}%`)
}

testReportSync()
