'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkOwnerRole } from './auth-actions'

export async function getPowTasks(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('pow_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

    if (error) {
        console.error('Error fetching PoW tasks:', error)
        return []
    }

    return data || []
}

export async function createPowTask(projectId: string, taskData: any) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        const { data, error } = await supabase
            .from('pow_tasks')
            .insert({
                project_id: projectId,
                task_name: taskData.task_name,
                description: taskData.description,
                start_date: taskData.start_date || null,
                end_date: taskData.end_date || null,
                duration_days: taskData.duration_days || 0,
                progress: taskData.progress || 0,
                status: taskData.status || 'not-started',
                assigned_to: taskData.assigned_to || null,
                estimated_cost: taskData.estimated_cost || 0,
                depends_on: taskData.depends_on || [],
                order_index: taskData.order_index || 0
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating PoW task:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true, data }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updatePowTask(taskId: string, projectId: string, taskData: any) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        const { data, error } = await supabase
            .from('pow_tasks')
            .update({
                task_name: taskData.task_name,
                description: taskData.description,
                start_date: taskData.start_date,
                end_date: taskData.end_date,
                duration_days: taskData.duration_days,
                progress: taskData.progress,
                status: taskData.status,
                assigned_to: taskData.assigned_to,
                estimated_cost: taskData.estimated_cost,
                depends_on: taskData.depends_on,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)
            .select()
            .single()

        if (error) {
            console.error('Error updating PoW task:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true, data }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deletePowTask(taskId: string, projectId: string) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        const { error } = await supabase
            .from('pow_tasks')
            .delete()
            .eq('id', taskId)

        if (error) {
            console.error('Error deleting PoW task:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateTaskProgress(taskId: string, projectId: string, progress: number) {
    const supabase = await createClient()

    // Auto-update status based on progress
    let status = 'not-started'
    if (progress > 0 && progress < 100) {
        status = 'in-progress'
    } else if (progress === 100) {
        status = 'completed'
    }

    try {
        await checkOwnerRole()

        const { error } = await supabase
            .from('pow_tasks')
            .update({
                progress,
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', taskId)

        if (error) {
            console.error('Error updating task progress:', error)
            return { success: false, error: error.message }
        }

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function getAllPowTasks() {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('pow_tasks')
        .select(`
            *,
            projects (
                id,
                name
            )
        `)
        .order('start_date', { ascending: true })
        .limit(20)

    if (error) {
        console.error('Error fetching all PoW tasks:', error)
        return []
    }

    return data || []
}

