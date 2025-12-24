'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMaterials() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('materials')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching materials:', error)
        return []
    }

    return data
}

export async function createMaterial(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const unit = formData.get('unit') as string
    const initialStock = parseFloat(formData.get('initial_stock') as string) || 0

    try {
        const { data, error } = await supabase
            .from('materials')
            .insert({
                name,
                description,
                unit,
                current_stock: initialStock
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating material:', error)
            return { success: false, error: error.message }
        }

        // If there's initial stock, record it as a transaction
        if (initialStock > 0) {
            await supabase.from('material_transactions').insert({
                material_id: data.id,
                transaction_type: 'IN',
                quantity: initialStock,
                notes: 'Initial stock'
            })
        }

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function addStock(formData: FormData) {
    const supabase = await createClient()

    const materialId = formData.get('material_id') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const notes = formData.get('notes') as string

    if (!materialId || quantity <= 0) {
        return { success: false, error: 'Invalid input' }
    }

    try {
        // 1. Record transaction
        const { error: txError } = await supabase
            .from('material_transactions')
            .insert({
                material_id: materialId,
                transaction_type: 'IN',
                quantity: quantity,
                notes: notes
            })

        if (txError) throw txError

        // 2. Update material stock
        const { data: mat, error: fetchError } = await supabase.from('materials').select('current_stock').eq('id', materialId).single()
        if (fetchError) throw fetchError

        const newStock = (mat.current_stock || 0) + quantity

        const { error: updateError } = await supabase
            .from('materials')
            .update({ current_stock: newStock })
            .eq('id', materialId)

        if (updateError) throw updateError

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function useMaterial(formData: FormData) {
    const supabase = await createClient()

    const materialId = formData.get('material_id') as string
    const quantity = parseFloat(formData.get('quantity') as string)
    const notes = formData.get('notes') as string
    const projectId = formData.get('project_id') as string

    if (!materialId || quantity <= 0) {
        return { success: false, error: 'Invalid input' }
    }

    try {
        // Check current stock
        const { data: mat, error: fetchError } = await supabase.from('materials').select('current_stock').eq('id', materialId).single()
        if (fetchError) throw fetchError

        if ((mat.current_stock || 0) < quantity) {
            return { success: false, error: 'Insufficient stock' }
        }

        // 1. Record transaction
        const { error: txError } = await supabase
            .from('material_transactions')
            .insert({
                material_id: materialId,
                transaction_type: 'OUT',
                quantity: quantity,
                notes: notes,
                project_id: projectId || null
            })

        if (txError) throw txError

        // 2. Update material stock
        const newStock = (mat.current_stock || 0) - quantity

        const { error: updateError } = await supabase
            .from('materials')
            .update({ current_stock: newStock })
            .eq('id', materialId)

        if (updateError) throw updateError

        revalidatePath('/dashboard/materials')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function bulkCreateMaterials(materials: { name: string; description?: string; unit: string; initial_stock: number; project_id?: string }[]) {
    const supabase = await createClient()

    try {
        const results = []
        const errors = []

        for (const m of materials) {
            // 1. Upsert material
            const { data: mat, error: matError } = await supabase
                .from('materials')
                .upsert({
                    name: m.name,
                    description: m.description,
                    unit: m.unit,
                }, { onConflict: 'name' })
                .select()
                .single()

            if (matError) {
                errors.push({ name: m.name, error: `Upsert Failed: ${matError.message}` })
                continue
            }

            // 2. Handle Stock
            if (m.initial_stock > 0) {
                const { error: txError } = await supabase.from('material_transactions').insert({
                    material_id: mat.id,
                    transaction_type: 'IN',
                    quantity: m.initial_stock,
                    notes: 'Bulk Import / Input',
                    project_id: m.project_id || null
                })

                if (txError) {
                    errors.push({ name: m.name, error: `Transaction Failed: ${txError.message}` })
                } else {
                    // Update stock count manually
                    const { data: current, error: fetchError } = await supabase.from('materials').select('current_stock').eq('id', mat.id).single()

                    if (fetchError) {
                        errors.push({ name: m.name, error: `Fetch Stock Failed: ${fetchError.message}` })
                    } else {
                        const { error: updateError } = await supabase.from('materials').update({
                            current_stock: (current?.current_stock || 0) + m.initial_stock
                        }).eq('id', mat.id)

                        if (updateError) {
                            errors.push({ name: m.name, error: `Update Stock Failed: ${updateError.message}` })
                        }
                    }
                }
            }
            results.push(mat)
        }

        revalidatePath('/dashboard/materials')

        // Return success if at least one worked, but include errors
        return {
            success: errors.length === 0,
            count: results.length,
            errors: errors.length > 0 ? errors : undefined
        }
    } catch (e: any) {
        return { success: false, error: `System Error: ${e.message}` }
    }
}

export async function getProjectMaterials(projectId: string) {
    const supabase = await createClient()

    const { data: transactions, error } = await supabase
        .from('material_transactions')
        .select(`
            quantity,
            materials (
                id,
                name,
                unit
            )
        `)
        .eq('project_id', projectId)
        .eq('transaction_type', 'OUT')

    if (error) {
        console.error('Error getting project materials:', error)
        return []
    }

    const usageMap = new Map<string, { id: string, name: string, unit: string, total: number }>()

    transactions.forEach((t: any) => {
        const mat = t.materials
        // @ts-ignore
        if (!mat) return

        // @ts-ignore
        if (!usageMap.has(mat.id)) {
            // @ts-ignore
            usageMap.set(mat.id, {
                // @ts-ignore
                id: mat.id,
                // @ts-ignore
                name: mat.name,
                // @ts-ignore
                unit: mat.unit,
                total: 0
            })
        }

        // @ts-ignore
        const current = usageMap.get(mat.id)!
        current.total += t.quantity
    })

    return Array.from(usageMap.values())
}

export async function getProjectMaterialSummary(projectId: string) {
    const supabase = await createClient()

    // Get all transactions for this project
    const { data: transactions, error } = await supabase
        .from('material_transactions')
        .select(`
            transaction_type,
            quantity,
            materials (
                id,
                name,
                unit
            )
        `)
        .eq('project_id', projectId)

    if (error) {
        console.error('Error getting project material summary:', error)
        return []
    }

    const summaryMap = new Map<string, { id: string, name: string, unit: string, total_in: number, total_out: number }>()

    transactions.forEach((t: any) => {
        const mat = t.materials
        // @ts-ignore
        if (!mat) return

        // @ts-ignore
        if (!summaryMap.has(mat.id)) {
            // @ts-ignore
            summaryMap.set(mat.id, {
                // @ts-ignore
                id: mat.id,
                // @ts-ignore
                name: mat.name,
                // @ts-ignore
                unit: mat.unit,
                total_in: 0,
                total_out: 0
            })
        }

        // @ts-ignore
        const current = summaryMap.get(mat.id)!

        if (t.transaction_type === 'IN') {
            current.total_in += t.quantity
        } else if (t.transaction_type === 'OUT') {
            current.total_out += t.quantity
        }
    })

    return Array.from(summaryMap.values())
}
