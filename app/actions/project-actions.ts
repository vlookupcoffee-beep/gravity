'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { checkOwnerRole } from './auth-actions'

export async function updateProjectStatus(projectId: string, newStatus: string) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        const { error } = await supabase
            .from('projects')
            .update({ status: newStatus })
            .eq('id', projectId)

        if (error) {
            console.error('Error updating project status:', error)
            return { success: false, error: error.message }
        }


        revalidatePath(`/dashboard/projects/${projectId}`)
        revalidatePath('/dashboard/projects')

        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const status = formData.get('status') as string
    const value = parseFloat(formData.get('value') as string) || 0
    const start_date = formData.get('start_date') as string
    const end_date = formData.get('end_date') as string

    try {
        await checkOwnerRole()

        const { data, error } = await supabase
            .from('projects')
            .insert({
                name,
                description,
                status,
                value,
                start_date: start_date || null,
                end_date: end_date || null,
                progress: 0
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating project:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard/projects')
        return { success: true, projectId: data.id }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteProject(projectId: string) {
    const supabase = await createClient()

    try {
        await checkOwnerRole()

        // Delete related data first (cascade delete)
        await supabase.from('structures').delete().eq('project_id', projectId)
        await supabase.from('routes').delete().eq('project_id', projectId)
        await supabase.from('rab_items').delete().eq('project_id', projectId)

        // Delete the project
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)

        if (error) {
            console.error('Error deleting project:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard/projects')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}


