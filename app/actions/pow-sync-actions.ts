'use server'

import { createClient } from '@/utils/supabase/server'
import { getProjectMaterialSummary } from './material-actions'
import { revalidatePath } from 'next/cache'

const TASK_MATERIAL_MAPPING = {
    "3.3 Penanaman Tiang dan Pembuatan HH": [
        "NP-7.0-140-2S",
        "NP-7.0-140-3S"
    ],
    "3.4 Penarikan Kabel": [
        "AC-ADSS-SM-12C",
        "AC-ADSS-SM-24C",
        "AC-ADSS-SM-48C",
        "ACC-STAINLESS BELT",
        "ACC-Bracket",
        "ACC-HELLICAL",
        "RP-GALVANIS",
        "FDT-STDG-288C"
    ],
    "3.5 Joint dan Terminasi": [
        "FAT-PB-16C-SOLID",
        "PS-1-16-FAT",
        "JC-OF-SM-48C"
    ]
}

export async function syncPowProgressWithMaterials(projectId: string) {
    const supabase = await createClient()

    // 1. Get material summary for this project
    const materialSummary = await getProjectMaterialSummary(projectId)
    if (!materialSummary || materialSummary.length === 0) return { success: false, message: 'No material data found' }

    // 2. Fetch PoW tasks for this project
    const { data: powTasks, error: powError } = await supabase
        .from('pow_tasks')
        .select('id, task_name, progress')
        .eq('project_id', projectId)

    if (powError || !powTasks) {
        console.error('Error fetching PoW tasks for sync:', powError)
        return { success: false, error: powError?.message }
    }

    const updates = []

    // 3. Calculate progress for each mapped task
    for (const [taskName, linkedMaterials] of Object.entries(TASK_MATERIAL_MAPPING)) {
        const matchingTask = powTasks.find(t => t.task_name === taskName)
        if (!matchingTask) continue

        // Filter summary for linked materials
        const linkedSummary = materialSummary.filter(m => linkedMaterials.includes(m.name))

        if (linkedSummary.length > 0) {
            let totalNeeded = 0
            let totalUsed = 0

            linkedSummary.forEach(m => {
                totalNeeded += (m.quantity_needed || 0)
                totalUsed += (m.total_out || 0)
            })

            // Calculate progress (capped at 100)
            const calculatedProgress = totalNeeded > 0
                ? Math.min(100, Math.round((totalUsed / totalNeeded) * 100))
                : 0

            // Only update if different
            if (calculatedProgress !== matchingTask.progress) {
                updates.push(
                    supabase
                        .from('pow_tasks')
                        .update({ progress: calculatedProgress })
                        .eq('id', matchingTask.id)
                )
            }
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates)
        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true, updatedCount: updates.length }
    }

    return { success: true, updatedCount: 0 }
}
