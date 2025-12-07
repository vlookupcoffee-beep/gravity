'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProjectStatus(projectId: string, newStatus: string) {
    const supabase = await createClient()

    try {
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
