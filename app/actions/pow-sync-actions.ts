'use server'

import { createClient } from '@/utils/supabase/server'
import { getProjectMaterialSummary } from './material-actions'
import { revalidatePath } from 'next/cache'

import { TASK_MATERIAL_MAPPING } from '@/utils/pow-constants'

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
    const materialProgress = new Map<string, number>()

    // --- LOGIC 1: Keyword matching for Qualitative Tasks (01-04, 09-10) ---
    const { data: reports } = await supabase
        .from('daily_reports')
        .select('today_activity')
        .eq('project_id', projectId)

    const allActivities = reports?.map(r => r.today_activity?.toUpperCase() || '').join(' ') || ''

    const keywordMapping = {
        "01.KICK OFF": ["KICK OFF", "KOM"],
        "02.SURVEY / AANWIJZHING LAPANGAN": ["SURVEY", "AANWIJZHING"],
        "03.DESIGN REVIEW MEETING": ["DRM", "DESIGN REVIEW"],
        "04.PERIJINAN": ["IJIN", "PERMIT", "PERIJINAN"],
        "09.SUBMIT ABD V4": ["SUBMIT ABD", "ABD V4"],
        "10.ATP": ["ATP", "BAST"]
    }

    for (const [taskName, keywords] of Object.entries(keywordMapping)) {
        const task = powTasks.find(t => t.task_name === taskName)
        if (task && task.progress < 100) {
            const match = keywords.some(k => allActivities.includes(k))
            if (match) {
                updates.push(
                    supabase.from('pow_tasks').update({ progress: 100, status: 'completed' }).eq('id', task.id)
                )
            }
        }
    }

    // --- LOGIC 2: Material Delivery (05) ---
    const task05 = powTasks.find(t => t.task_name === "05.DELIVERY MATERIAL")
    if (task05) {
        let totalNeeded = materialSummary.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
        let totalIn = materialSummary.reduce((acc, m) => acc + (m.total_in || 0), 0)
        const progress = totalNeeded > 0 ? Math.min(100, Math.round((totalIn / totalNeeded) * 100)) : 0
        if (progress !== task05.progress) {
            updates.push(
                supabase.from('pow_tasks').update({ progress, status: progress === 100 ? 'completed' : 'in-progress' }).eq('id', task05.id)
            )
        }
    }

    // --- LOGIC 3: Material Usage (06, 07) ---
    for (const [taskName, linkedMaterials] of Object.entries(TASK_MATERIAL_MAPPING)) {
        const matchingTask = powTasks.find(t => t.task_name === taskName)
        if (!matchingTask) continue

        const linkedSummary = materialSummary.filter(m => linkedMaterials.includes(m.name))
        let progress = 0

        if (linkedSummary.length > 0) {
            let totalNeeded = linkedSummary.reduce((acc, m) => acc + (m.quantity_needed || 0), 0)
            let totalUsed = linkedSummary.reduce((acc, m) => acc + (m.total_out || 0), 0)
            progress = totalNeeded > 0 ? Math.min(100, Math.round((totalUsed / totalNeeded) * 100)) : 0

            if (progress !== matchingTask.progress) {
                updates.push(
                    supabase.from('pow_tasks').update({ progress, status: progress === 100 ? 'completed' : 'in-progress' }).eq('id', matchingTask.id)
                )
            }
        }
        materialProgress.set(taskName, progress || matchingTask.progress)
    }

    // --- LOGIC 4: Installation Done (08) ---
    const task08 = powTasks.find(t => t.task_name === "08.DONE INSTALASI")
    if (task08) {
        const p06 = materialProgress.get("06.PENARIKAN KABEL & TANAM TIANG") || 0
        const p07 = materialProgress.get("07.INSTALASI ODP") || 0
        if (p06 === 100 && p07 === 100 && task08.progress < 100) {
            updates.push(
                supabase.from('pow_tasks').update({ progress: 100, status: 'completed' }).eq('id', task08.id)
            )
        }
    }

    if (updates.length > 0) {
        await Promise.all(updates)
        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true, updatedCount: updates.length }
    }

    return { success: true, updatedCount: 0 }
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
