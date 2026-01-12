'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkOwnerRole, getCurrentUser } from './auth-actions'

// --- Expenses ---

export async function getExpenses(projectId?: string) {
    const supabase = await createClient()

    let query = supabase
        .from('expenses')
        .select(`
            *,
            projects (
                id,
                name
            )
        `)
        .order('date', { ascending: false })

    if (projectId) {
        query = query.eq('project_id', projectId)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching expenses:', error)
        return []
    }

    return data || []
}

export async function createExpense(expenseData: any) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()
        const user = await getCurrentUser()

        const { data, error } = await supabase
            .from('expenses')
            .insert({
                project_id: expenseData.project_id || null,
                amount: expenseData.amount,
                category: expenseData.category,
                description: expenseData.description,
                date: expenseData.date || new Date().toISOString().split('T')[0],
                created_by: user.telegram_id || null // If available
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/dashboard/finance')
        return { success: true, data }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// --- Payment Milestones ---

export async function getProjectMilestones(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_payment_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching milestones:', error)
        return []
    }

    return data || []
}

export async function createMilestone(milestoneData: any) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        const { data, error } = await supabase
            .from('project_payment_milestones')
            .insert({
                project_id: milestoneData.project_id,
                label: milestoneData.label,
                percentage: milestoneData.percentage,
                amount: milestoneData.amount,
                trigger_condition: milestoneData.trigger_condition,
                trigger_value: milestoneData.trigger_value,
                type: milestoneData.type || 'IN',
                is_paid: false
            })
            .select()
            .single()

        if (error) throw error

        revalidatePath('/dashboard/finance')
        return { success: true, data }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function updateMilestonePayment(milestoneId: string, isPaid: boolean) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        // If it's a Mandor Payment (OUT), we also record it as an expense when paid
        if (isPaid) {
            const { data: milestone } = await supabase
                .from('project_payment_milestones')
                .select('*, projects(name)')
                .eq('id', milestoneId)
                .single()

            if (milestone && milestone.type === 'OUT') {
                await supabase.from('expenses').insert({
                    project_id: milestone.project_id,
                    amount: milestone.amount,
                    category: 'Termin Mandor',
                    description: `Pembayaran ${milestone.label} - ${milestone.projects?.name}`,
                    date: new Date().toISOString().split('T')[0]
                })
            }
        }

        const { error } = await supabase
            .from('project_payment_milestones')
            .update({
                is_paid: isPaid,
                paid_at: isPaid ? new Date().toISOString() : null
            })
            .eq('id', milestoneId)

        if (error) throw error

        revalidatePath('/dashboard/finance')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

// --- Logic Helpers ---

export async function calculateProjectProgress(projectId: string) {
    const supabase = await createClient()

    const { data: tasks, error } = await supabase
        .from('pow_tasks')
        .select('task_name, progress')
        .eq('project_id', projectId)

    if (error || !tasks) return { fieldProgress: 0, totalProgress: 0 }

    const totalTasks = tasks.length
    if (totalTasks === 0) return { fieldProgress: 0, totalProgress: 0 }

    const fieldTasks = tasks.filter(t => !t.task_name.startsWith('1.'))

    const totalProgress = Math.round(tasks.reduce((acc, t) => acc + (t.progress || 0), 0) / totalTasks)
    const fieldProgress = fieldTasks.length > 0
        ? Math.round(fieldTasks.reduce((acc, t) => acc + (t.progress || 0), 0) / fieldTasks.length)
        : 0

    return { fieldProgress, totalProgress }
}
