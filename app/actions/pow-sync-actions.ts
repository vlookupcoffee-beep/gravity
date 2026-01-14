'use server'

import { createClient } from '@/utils/supabase/server'
import { getProjectMaterialSummary } from './material-actions'
import { revalidatePath } from 'next/cache'

import { TASK_MATERIAL_KW_MAPPING } from '@/utils/pow-constants'

export async function syncPowProgressWithMaterials(projectId: string) {
    const supabase = await createClient()

    // 1. Get material summary for this project
    const materialSummary = await getProjectMaterialSummary(projectId)
    if (!materialSummary || materialSummary.length === 0) return { success: false, message: 'No material data found' }

    // 2. Fetch PoW tasks for this project
    const { data: powTasks, error: powError } = await supabase
        .from('pow_tasks')
        .select('*')
        .eq('project_id', projectId)

    if (powError || !powTasks) {
        console.error('Error fetching PoW tasks for sync:', powError)
        return { success: false, error: powError?.message }
    }

    const updates = []
    const taskProgressMap = new Map<string, number>()

    // Fetch reports for qualitative tasks
    const { data: reports } = await supabase
        .from('daily_reports')
        .select('today_activity')
        .eq('project_id', projectId)

    const allActivities = reports?.map(r => r.today_activity?.toUpperCase() || '').join(' ') || ''

    // --- LOGIC 1: Keyword matching for Qualitative Tasks ---
    const qualitativeMapping = {
        "KICK OFF": ["KICK OFF", "KOM"],
        "SURVEY": ["SURVEY", "AANWIJZHING"],
        "DRM": ["DRM", "DESIGN REVIEW"],
        "IJIN": ["IJIN", "PERMIT", "PERIJINAN"],
        "ABD": ["SUBMIT ABD", "ABD V4"],
        "ATP": ["ATP", "BAST"]
    }

    for (const task of powTasks) {
        const upperName = task.task_name.toUpperCase()

        // 1. Check for Qualitative match
        let foundQual = false
        for (const [key, keywords] of Object.entries(qualitativeMapping)) {
            if (upperName.includes(key) || keywords.some(k => upperName.includes(k))) {
                foundQual = true
                if (task.progress < 100) {
                    const matchInReports = keywords.some(k => allActivities.includes(k)) || allActivities.includes(key)
                    if (matchInReports) {
                        updates.push(
                            supabase.from('pow_tasks').update({ progress: 100, status: 'completed' }).eq('id', task.id)
                        )
                        taskProgressMap.set(task.id, 100)
                    }
                }
                break
            }
        }
        if (foundQual) continue

        // 2. Check for Delivery match
        if (upperName.includes("DELIVERY") || upperName.includes("LOGISTIK")) {
            let totalNeeded = 0
            let totalIn = 0

            // If task name is specific (e.g. "Delivery ... Kabel"), filter materials
            let relevantMaterials = materialSummary
            if (upperName.includes("KABEL")) relevantMaterials = materialSummary.filter(m => m.name.includes("KABEL") || m.name.includes("ADSS"))
            if (upperName.includes("TIANG")) relevantMaterials = materialSummary.filter(m => m.name.includes("TIANG") || m.name.includes("NP"))
            if (upperName.includes("ODP") || upperName.includes("FAT")) relevantMaterials = materialSummary.filter(m => m.name.includes("ODP") || m.name.includes("FAT") || m.name.includes("PS"))

            totalNeeded = relevantMaterials.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
            totalIn = relevantMaterials.reduce((acc, m) => acc + (m.total_in || 0), 0)

            const progress = totalNeeded > 0 ? Math.min(100, Math.round((totalIn / totalNeeded) * 100)) : 0
            if (progress !== task.progress) {
                updates.push(
                    supabase.from('pow_tasks').update({ progress, status: progress === 100 ? 'completed' : 'in-progress' }).eq('id', task.id)
                )
                taskProgressMap.set(task.id, progress)
            }
            continue
        }

        // 3. Check for Material Usage match
        let matchedKeywords = []
        for (const [kw, linkedMaterials] of Object.entries(TASK_MATERIAL_KW_MAPPING)) {
            if (upperName.includes(kw) || (kw === "KABEL" && upperName.includes("PENARIKAN")) || (kw === "TIANG" && upperName.includes("PENANAMAN"))) {
                matchedKeywords.push(kw)
            }
        }

        if (matchedKeywords.length > 0) {
            let allLinkedMaterials: string[] = []
            for (const kw of matchedKeywords) {
                // @ts-ignore
                allLinkedMaterials = [...allLinkedMaterials, ...(TASK_MATERIAL_KW_MAPPING[kw] || [])]
            }

            // Filter materials that belong to ANY of the matched keywords
            const linkedSummary = materialSummary.filter(m =>
                allLinkedMaterials.includes(m.name) ||
                matchedKeywords.some(kw => m.name.includes(kw))
            )

            let totalNeeded = linkedSummary.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
            let totalUsed = linkedSummary.reduce((acc, m) => acc + (m.total_out || 0), 0)
            const progress = totalNeeded > 0 ? Math.min(100, Math.round((totalUsed / totalNeeded) * 100)) : 0

            if (progress !== task.progress) {
                updates.push(
                    supabase.from('pow_tasks').update({ progress, status: progress === 100 ? 'completed' : 'in-progress' }).eq('id', task.id)
                )
                taskProgressMap.set(task.id, progress)
            }
            continue
        }
    }

    // --- LOGIC 4: Specialized Done logic (only if specifically named) ---
    const doneTask = powTasks.find(t => t.task_name.toUpperCase().includes("DONE") || t.task_name.toUpperCase().includes("SELESAI INSTALASI"))
    if (doneTask && doneTask.progress < 100) {
        // Check if all installation tasks are done
        const installTasks = powTasks.filter(t => t.task_name.toUpperCase().includes("KABEL") || t.task_name.toUpperCase().includes("TIANG") || t.task_name.toUpperCase().includes("ODP"))
        if (installTasks.length > 0 && installTasks.every(t => (taskProgressMap.get(t.id) || t.progress) === 100)) {
            updates.push(
                supabase.from('pow_tasks').update({ progress: 100, status: 'completed' }).eq('id', doneTask.id)
            )
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates)
    }

    // --- LOGIC 5: Sync Overall Project Progress ---
    const { data: latestTasks } = await supabase
        .from('pow_tasks')
        .select('progress')
        .eq('project_id', projectId)

    if (latestTasks && latestTasks.length > 0) {
        const total = latestTasks.reduce((acc, t) => acc + (t.progress || 0), 0)
        const overallProgress = Math.round(total / latestTasks.length)

        await supabase
            .from('projects')
            .update({ progress: overallProgress })
            .eq('id', projectId)
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true, updatedCount: updates.length }
}


export async function bulkSyncAllProjectsPow() {
    const supabase = await createClient()

    try {
        const { checkOwnerRole } = await import('./auth-actions')
        const { bulkInitializeAllProjectsPow } = await import('./pow-actions')
        await checkOwnerRole()

        // 1. Ensure all projects have PoW tasks initialized
        await bulkInitializeAllProjectsPow()

        // 2. Get all projects
        const { data: projects } = await supabase.from('projects').select('id')
        if (!projects) return { success: false, error: 'No projects found' }

        let totalUpdated = 0
        const results = []

        // 3. Sync each project
        for (const project of projects) {
            const result = await syncPowProgressWithMaterials(project.id)
            if (result.success) {
                totalUpdated += (result.updatedCount || 0)
            }
            results.push({ id: project.id, ...result })
        }

        revalidatePath('/dashboard')
        return { success: true, totalUpdated, projectCount: projects.length }
    } catch (e: any) {
        console.error('Error in bulkSyncAllProjectsPow:', e)
        return { success: false, error: e.message }
    }
}
