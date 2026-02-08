
'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getSCurveData(projectId: string) {
    const supabase = await createClient()

    // 1. Fetch Plan Data
    const { data: plans } = await supabase
        .from('project_plans')
        .select('target_date, target_progress')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true })

    // 2. Fetch Actual History
    const { data: history } = await supabase
        .from('project_progress_history')
        .select('record_date, actual_progress')
        .eq('project_id', projectId)
        .order('record_date', { ascending: true })

    // 3. Merge data for Recharts
    // Collect all unique dates
    const allDates = new Set<string>()
    plans?.forEach(p => allDates.add(p.target_date))
    history?.forEach(h => allDates.add(h.record_date))

    const sortedDates = Array.from(allDates).sort()

    const chartData = sortedDates.map(date => {
        const plan = plans?.find(p => p.target_date === date)
        const actual = history?.find(h => h.record_date === date)
        return {
            date,
            plan: plan ? plan.target_progress : null,
            actual: actual ? actual.actual_progress : null
        }
    })

    return chartData
}

export async function updateProjectPlan(projectId: string, plans: { date: string, progress: number }[]) {
    const supabase = await createClient()

    const updates = plans.map(p => ({
        project_id: projectId,
        target_date: p.date,
        target_progress: p.progress
    }))

    const { error } = await supabase
        .from('project_plans')
        .upsert(updates, { onConflict: 'project_id,target_date' })

    if (error) {
        throw error
    }

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

export async function generateLinearPlan(projectId: string) {
    const supabase = await createClient()

    const { data: project } = await supabase.from('projects').select('start_date, end_date').eq('id', projectId).single()
    if (!project || !project.start_date || !project.end_date) {
        throw new Error('Start date and end date are required for auto-planning')
    }

    const start = new Date(project.start_date)
    const end = new Date(project.end_date)
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    const plans = []
    // Create 10 points for the curve
    for (let i = 0; i <= 10; i++) {
        const date = new Date(start.getTime() + (totalDays * (i / 10)) * (1000 * 60 * 60 * 24))
        plans.push({
            project_id: projectId,
            target_date: date.toISOString().split('T')[0],
            target_progress: i * 10
        })
    }

    const { error } = await supabase
        .from('project_plans')
        .upsert(plans, { onConflict: 'project_id,target_date' })

    if (error) throw error

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}
