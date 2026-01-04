'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Helper: Recalculate and update Project Total Value
async function updateProjectValue(projectId: string) {
    const supabase = await createClient()

    // 1. Calculate Sums
    const { data: items } = await supabase
        .from('project_items')
        .select('unit_price, quantity, unit_price_mandor, quantity_mandor')
        .eq('project_id', projectId)

    const totalValueVendor = items?.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0) || 0
    const totalValueMandor = items?.reduce((acc, item) => acc + (item.unit_price_mandor * (item.quantity_mandor || 0)), 0) || 0

    // 2. Update Project
    const { error } = await supabase
        .from('projects')
        .update({
            value: totalValueVendor,
            value_mandor: totalValueMandor
        })
        .eq('id', projectId)

    if (error) {
        console.error('FAILED to update project value:', error)
    } else {
        console.log(`Successfully updated project ${projectId} values: Vendor=${totalValueVendor}, Mandor=${totalValueMandor}`)
    }
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

// Recalculate Project Value Publicly
export async function recalculateProjectValue(projectId: string) {
    await updateProjectValue(projectId)
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}

// Bulk Upload Project Items from CSV
export async function uploadProjectItems(projectId: string, providerId: string, formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File

    if (!file) {
        return { success: false, error: 'No file uploaded' }
    }

    // 1. Get KHS Items for this provider to match codes
    const { data: khsItems } = await supabase
        .from('khs_items')
        .select('*')
        .eq('provider_id', providerId)

    if (!khsItems || khsItems.length === 0) {
        return { success: false, error: 'No KHS items found for this provider' }
    }

    const khsMap = new Map(khsItems.map(i => [i.item_code.trim(), i]))

    // 2. Parse CSV
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0)

    // Skip header
    const startIndex = lines[0].toLowerCase().includes('item') ? 1 : 0

    // 3. Get Existing Project Items to MERGE by item_code
    const { data: existingProjectItems } = await supabase
        .from('project_items')
        .select('*')
        .eq('project_id', projectId)

    const existingMap = new Map((existingProjectItems || []).map(i => [i.item_code, i]))
    const itemsToUpsert = []
    let skippedCount = 0

    const uploadType = formData.get('uploadType') as string || 'vendor'

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i]
        const parts = line.includes(';') ? line.split(';') : line.split(',')
        if (parts.length < 2) continue

        const code = parts[0].trim()
        const qtyStr = parts[1].trim()
        const quantity = parseFloat(qtyStr)

        if (!code || isNaN(quantity) || quantity <= 0) {
            skippedCount++
            continue
        }

        const khsItem = khsMap.get(code)
        if (khsItem) {
            const existing = existingMap.get(code)

            const itemData = {
                project_id: projectId,
                item_code: khsItem.item_code,
                khs_item_id: khsItem.id,
                description: khsItem.description,
                unit: khsItem.unit,
                unit_price: uploadType === 'vendor' ? khsItem.price : (existing?.unit_price || 0),
                unit_price_mandor: uploadType === 'mandor' ? (khsItem.price_mandor || khsItem.price) : (existing?.unit_price_mandor || khsItem.price_mandor || 0),
                quantity: uploadType === 'vendor' ? quantity : (existing?.quantity || 0),
                quantity_mandor: uploadType === 'mandor' ? quantity : (existing?.quantity_mandor || 0),
                progress: existing?.progress || 0
            }

            itemsToUpsert.push(itemData)
        } else {
            skippedCount++
        }
    }

    if (itemsToUpsert.length === 0) {
        return { success: false, error: 'No valid items found to insert. Check CSV format (Item Code, Quantity)' }
    }

    // 4. Upsert Items (Conflict on item_code)
    const { error } = await supabase
        .from('project_items')
        .upsert(itemsToUpsert, { onConflict: 'project_id,item_code' })

    if (error) {
        console.error('Upsert Error:', error)
        return { success: false, error: error.message }
    }

    // 5. Update Project totals
    await updateProjectValue(projectId)
    revalidatePath(`/dashboard/projects/${projectId}`)

    return { success: true, count: itemsToUpsert.length, skipped: skippedCount }
}

// Add an item to the Project BOQ
export async function addProjectItem(projectId: string, khsItem: any, quantity: number) {
    const supabase = await createClient()

    const uploadType = (khsItem as any).uploadType || 'vendor'

    // Check if exists by item_code
    const { data: existing } = await supabase
        .from('project_items')
        .select('*')
        .eq('project_id', projectId)
        .eq('item_code', khsItem.item_code)
        .maybeSingle()

    const itemToUpsert = {
        project_id: projectId,
        item_code: khsItem.item_code,
        khs_item_id: khsItem.id,
        description: khsItem.description,
        unit: khsItem.unit,
        unit_price: uploadType === 'vendor' ? khsItem.price : (existing?.unit_price || 0),
        unit_price_mandor: uploadType === 'mandor' ? (khsItem.price_mandor || khsItem.price) : (existing?.unit_price_mandor || khsItem.price_mandor || 0),
        quantity: uploadType === 'vendor' ? quantity : (existing?.quantity || 0),
        quantity_mandor: uploadType === 'mandor' ? quantity : (existing?.quantity_mandor || 0),
        progress: existing?.progress || 0
    }

    const { error } = await supabase
        .from('project_items')
        .upsert(itemToUpsert, { onConflict: 'project_id,item_code' })

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

// Delete ALL items from Project BOQ (for re-upload)
export async function deleteAllProjectItems(projectId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('project_items')
        .delete()
        .eq('project_id', projectId)

    if (error) {
        return { success: false, error: error.message }
    }

    await updateProjectValue(projectId)
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
}
