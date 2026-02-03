
// scripts/check_project_progress.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wbfmylhcqzfjqscvazfm.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndiZm15bGhjcXpmanFzY3ZhemZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODgyOTksImV4cCI6MjA4MDU2NDI5OX0.SMqHv_fDNGuiZ76VkMQY-QdIQTY35E8arTJd7ns9zKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Constants from pow-constants.ts
const STATUS_WEIGHT_MAPPING = [
    { name: "DD-BRNG-HDPE", weight: 30, identifiers: ["DD-BRNG-HDPE-40-1"] },
    { name: "HDPE", weight: 10, identifiers: ["HDPE-40-33"] },
    { name: "KABEL", weight: 15, identifiers: ["AC-ADSS-SM-96C", "AC-ADSS-SM-12C", "AC-ADSS-SM-24C", "AC-ADSS-SM-48C", "AC-ADSS-SM-144C"] },
    { name: "ACCESSORIES", weight: 10, identifiers: ["FS-OF-SM", "CO-OF-SM"] },
    { name: "PIT_MH", weight: 10, identifiers: ["MH-PIT-120", "MH-PIT-80"] },
    { name: "TIANG", weight: 15, identifiers: ["NP-7.0-140-3S", "NP-7.0-140-2S", "NP-9.0-140-3S"] }
];

async function getMaterialSummary(projectId: string) {
    // 1. Get requirements
    const { data: requirements } = await supabase
        .from('project_materials')
        .select(`
            *,
            material:materials(*)
        `)
        .eq('project_id', projectId)

    if (!requirements) return []

    // 2. Get transactions (out)
    const { data: transactions } = await supabase
        .from('material_transactions')
        .select('*')
        .eq('project_id', projectId)
        .eq('transaction_type', 'OUT')

    // 3. Merge
    return requirements.map(req => {
        const out = transactions?.filter(t => t.material_id === req.material_id).reduce((sum, t) => sum + t.quantity, 0) || 0
        return {
            name: req.material.name,
            quantity_needed: req.quantity_refined || req.quantity_rab || 0,
            total_out: out
        }
    })
}

async function checkProject() {
    console.log("Searching for projects with 'RAMBIPUJI'...")
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .ilike('name', `%RAMBIPUJI%`)

    if (error) {
        console.error("Error searching projects:", error)
        return
    }

    if (!projects || projects.length === 0) {
        console.log("No projects found with RAMBIPUJI.")
        return
    }

    console.log(`Found ${projects.length} projects. Checking the first one:`)

    // Check specific project: IDNET - BACKBONE - RAMBIPUJI TO PUGER
    const target = projects.find(p => p.name.includes("RAMBIPUJI TO PUGER")) || projects[0]

    console.log(`Found Project: ${target.name} (ID: ${target.id})`)

    // 2. Get Data
    const materialSummary = await getMaterialSummary(target.id)
    if (!materialSummary.length) console.log("No materials found in breakdown")

    // 3. Calculate Weighted Progress
    let currentWeightedScore = 0
    let usedMaterialNames = new Set()

    for (const category of STATUS_WEIGHT_MAPPING) {
        const relevantMaterials = materialSummary.filter(m => category.identifiers.includes(m.name))

        if (relevantMaterials.length > 0) {
            const totalNeeded = relevantMaterials.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
            const totalOut = relevantMaterials.reduce((acc, m) => acc + (m.total_out || 0), 0)

            const categoryProgress = totalNeeded > 0 ? (totalOut / totalNeeded) : 0
            const contribution = categoryProgress * category.weight

            console.log(`Category ${category.name}: ${(categoryProgress * 100).toFixed(1)}% -> +${contribution.toFixed(1)}`)
            currentWeightedScore += contribution
            relevantMaterials.forEach(m => usedMaterialNames.add(m.name))
        } else {
            console.log(`Category ${category.name}: 0% (No materials)`)
        }
    }

    // Remainder
    const remainingMaterials = materialSummary.filter(m => !usedMaterialNames.has(m.name))
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
    console.log(`\nCALCULATED WEIGHTED SCORE: ${finalScore}%`)
}

checkProject()
