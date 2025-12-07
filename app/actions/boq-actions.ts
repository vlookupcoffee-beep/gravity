'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper: Recalculate and update Project Total Value
async function updateProjectValue(projectId: string) {
    const supabase = await createClient()

    // 1. Calculate Sum
    const { data: items } = await supabase
        .from('project_items')
        .select('unit_price, quantity')
        .eq('project_id', projectId)

    const totalValue = items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) || 0

    // 2. Update Project
    await supabase.from('projects').update({ value: totalValue }).eq('id', projectId)
}

// Fetch items from a specific KHS Provider
export async function getKHSItems(providerId: string, search: string = '') {
    const supabase = await createClient()
    let query = supabase
        .from('khs_items')
        .select('*')
        .eq('provider_id', providerId)
        .order('item_code', { ascending: true })
        .limit(50)

    if (search) {
        query = query.or(`item_code.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, error } = await query
    if (error) return []
    return data
}

// Add an item to the Project BOQ
export async function addProjectItem(projectId: string, khsItem: any, quantity: number) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('project_items')
        .insert({
            project_id: projectId,
            khs_item_id: khsItem.id,
            item_code: khsItem.item_code,
            description: khsItem.description,
            unit: khsItem.unit,
            unit_price: khsItem.price,
            quantity: quantity,
            progress: 0
        })

    if (error) {
        console.error('Error adding project item:', error)
        return { success: false, error: error.message }
    }

    await updateProjectValue(projectId)
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

// Delete an item from Project BOQ
export async function deleteProjectItem(itemId: string, projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('project_items')
        .delete()
        .eq('id', itemId)

    if (error) {
        return { success: false, error: error.message }
    }

    await updateProjectValue(projectId)
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

// Fetch existing items for a project
export async function getProjectItems(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_items')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('Error fetching project items:', error)
        return []
    }

    return data
}
