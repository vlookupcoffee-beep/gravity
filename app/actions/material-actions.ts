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
        // We do this by calling a stored procedure or just manual update. 
        // For simplicity and since we don't have a complex trigger setup, we'll fetch and update or use details if available.
        // Better approach: use a DB function or simple increment. 
        // Let's do a read-modify-write for now or use rpc if we had one. 
        // Actually, let's just do a direct update.

        // Fetch current stock first to be safe or use atomic increment if possible via RPC?
        // Supabase JS doesn't support atomic increment easily without RPC.
        // Let's fetch current first.

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
                notes: notes
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
