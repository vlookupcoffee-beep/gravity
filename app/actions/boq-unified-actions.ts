'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Get unified BOQ data from project_material_requirements
 * This replaces the old getProjectItems function
 */
export async function getProjectBOQUnified(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_material_requirements')
        .select(`
            *,
            materials (
                id,
                name,
                description,
                unit,
                khs_item_code
            )
        `)
        .eq('project_id', projectId)
        .order('item_code')

    if (error) {
        console.error('Error fetching unified BOQ:', error)
        return []
    }

    // Transform to match old project_items format for backward compatibility
    return data.map(item => ({
        id: item.id,
        project_id: item.project_id,
        item_code: item.item_code || item.materials?.khs_item_code || item.materials?.name,
        description: item.description || item.materials?.description || '',
        unit: item.materials?.unit || '',
        quantity: item.quantity_needed,
        unit_price: item.unit_price_vendor || 0,
        unit_price_mandor: item.unit_price_mandor || 0,
        // Computed values (already calculated by DB)
        total_value_vendor: item.total_value_vendor || 0,
        total_value_mandor: item.total_value_mandor || 0,
        distribution_name: item.distribution_name || '',
        material_id: item.material_id,
        created_at: item.created_at,
        updated_at: item.updated_at
    }))
}

/**
 * Get BOQ summary (totals)
 */
export async function getProjectBOQSummary(projectId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('project_material_requirements')
        .select('total_value_vendor, total_value_mandor')
        .eq('project_id', projectId)

    if (error) {
        console.error('Error fetching BOQ summary:', error)
        return { totalVendor: 0, totalMandor: 0, itemCount: 0 }
    }

    const totalVendor = data.reduce((sum, item) => sum + (item.total_value_vendor || 0), 0)
    const totalMandor = data.reduce((sum, item) => sum + (item.total_value_mandor || 0), 0)

    return {
        totalVendor,
        totalMandor,
        itemCount: data.length
    }
}

/**
 * Upload BOQ items - NEW VERSION
 * Now populates both materials and project_material_requirements
 */
export async function uploadProjectBOQUnified(
    projectId: string,
    items: Array<{
        item_code: string
        description: string
        unit: string
        quantity: number
        unit_price: number
        unit_price_mandor?: number
        distribution_name?: string
    }>
) {
    const supabase = await createClient()

    try {
        const results = []
        const errors = []

        for (const item of items) {
            try {
                // 1. Upsert material (master data)
                const { data: material, error: matError } = await supabase
                    .from('materials')
                    .upsert({
                        name: item.item_code,
                        description: item.description,
                        unit: item.unit,
                        khs_item_code: item.item_code
                    }, { onConflict: 'name' })
                    .select()
                    .single()

                if (matError) {
                    errors.push({ item_code: item.item_code, error: matError.message })
                    continue
                }

                // 2. Upsert requirement with prices
                const { error: reqError } = await supabase
                    .from('project_material_requirements')
                    .upsert({
                        project_id: projectId,
                        material_id: material.id,
                        quantity_needed: item.quantity,
                        unit_price_vendor: item.unit_price,
                        unit_price_mandor: item.unit_price_mandor || 0,
                        item_code: item.item_code,
                        description: item.description,
                        distribution_name: item.distribution_name || ''
                    }, { onConflict: 'project_id,material_id,distribution_name' })

                if (reqError) {
                    errors.push({ item_code: item.item_code, error: reqError.message })
                    continue
                }

                results.push(material)
            } catch (e: any) {
                errors.push({ item_code: item.item_code, error: e.message })
            }
        }

        // Update project total value
        const summary = await getProjectBOQSummary(projectId)
        await supabase
            .from('projects')
            .update({ value: summary.totalVendor })
            .eq('id', projectId)

        revalidatePath(`/dashboard/projects/${projectId}`)
        revalidatePath('/dashboard/projects')

        return {
            success: errors.length === 0,
            count: results.length,
            errors: errors.length > 0 ? errors : undefined
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

/**
 * Delete BOQ item
 */
export async function deleteProjectBOQItem(itemId: string, projectId: string) {
    const supabase = await createClient()

    try {
        // 1. Get item details first to find item_code
        const { data: itemToDelete } = await supabase
            .from('project_material_requirements')
            .select('item_code')
            .eq('id', itemId)
            .single()

        // 2. Delete from NEW table
        const { error } = await supabase
            .from('project_material_requirements')
            .delete()
            .eq('id', itemId)

        if (error) throw error

        // 3. Delete from OLD table (backward compatibility)
        if (itemToDelete?.item_code) {
            await supabase
                .from('project_items')
                .delete()
                .eq('project_id', projectId)
                .eq('item_code', itemToDelete.item_code)
        }

        // Recalculate project value
        const summary = await getProjectBOQSummary(projectId)
        await supabase
            .from('projects')
            .update({ value: summary.totalVendor })
            .eq('id', projectId)

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

/**
 * Delete all BOQ items for a project
 */
export async function deleteAllProjectBOQ(projectId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('project_material_requirements')
            .delete()
            .eq('project_id', projectId)

        if (error) throw error

        // Reset project value
        await supabase
            .from('projects')
            .update({ value: 0 })
            .eq('id', projectId)

        revalidatePath(`/dashboard/projects/${projectId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
