'use server'

import { createClient } from '@/utils/supabase/server'
import { getProjectMaterialSummary, getAvailableDistributions } from './material-actions'

export async function generateGlobalReportCsv() {
    const supabase = await createClient()

    // 1. Get All Projects
    const { data: projects, error } = await supabase
        .from('projects')
        .select('*')
        .order('name')

    if (error || !projects) {
        console.error('Error fetching projects for CSV:', error)
        return null
    }

    // 2. Prepare CSV Header
    const header = [
        'NAMAPROJECT',
        'CATEGORY STATUS',
        'NILAI VENDOR',
        'NILAI MANDOR',
        'PERSENTASE PROGRES ALL',
        'PERSENTASE MATERIAL',
        'JUMLAH DISTRIBUSI',
        'PERSENTASE D1',
        'PERSENTASE D2',
        'PERSENTASE D3',
        'PERSENTASE D4',
        'PERSENTASE D5'
    ]

    const rows = [header.join(',')]

    // 3. Process Each Project
    for (const project of projects) {
        // A. Basic Info
        const name = `"${project.name.replace(/"/g, '""')}"` // Escape quotes
        const status = project.status || 'Active'
        const valueVendor = project.value || 0
        const valueMandor = project.value_mandor || 0
        const progressAll = project.progress || 0

        // B. Material Percentage (Overall)
        // Optimization: We could fetch raw transactions/requirements for ALL projects in one go if this is too slow.
        // For now, we call the existing helper for consistency.
        const summary = await getProjectMaterialSummary(project.id)

        let totalNeeded = 0
        let totalUsed = 0

        summary.forEach((m: any) => {
            totalNeeded += m.quantity_needed || 0
            totalUsed += m.total_out || 0
        })

        const percentMaterial = totalNeeded > 0 ? ((totalUsed / totalNeeded) * 100).toFixed(2) : "0"

        // C. Distributions
        const distNames = await getAvailableDistributions(project.id)
        // Sort to ensure D1 is always the "first" distribution found (e: "Distribusi 01")
        distNames.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

        const countDist = distNames.length

        // Calculate D1..D5
        const dPercents = []
        for (let i = 0; i < 5; i++) {
            if (i < distNames.length) {
                const dName = distNames[i]
                // We need summary specific to this dist
                // Existing getProjectMaterialSummary accepts optional distName
                // This is N*M queries, might be slow. Valid point for optimization later.
                const dSummary = await getProjectMaterialSummary(project.id, dName)

                let dNeeded = 0
                let dUsed = 0
                dSummary.forEach((m: any) => {
                    dNeeded += m.quantity_needed || 0
                    dUsed += m.total_out || 0
                })

                const dPct = dNeeded > 0 ? ((dUsed / dNeeded) * 100).toFixed(2) : "0"
                dPercents.push(dPct)
            } else {
                dPercents.push("0")
            }
        }

        // Construct Row
        const row = [
            name,
            status,
            valueVendor,
            valueMandor,
            progressAll,
            percentMaterial,
            countDist,
            ...dPercents
        ]

        rows.push(row.join(','))
    }

    return rows.join('\n')
}
