'use server'

import { createClient } from '@/utils/supabase/server'

/**
 * Debug tool to check BOQ item values
 * This helps identify if values are stored correctly in database
 */
export async function debugBOQItem(itemCode: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('rab_items')
        .select('*')
        .eq('item_code', itemCode)
        .single()

    if (error) {
        console.error('Error fetching item:', error)
        return { error: error.message }
    }

    if (!data) {
        return { error: 'Item not found' }
    }

    // Calculate expected total
    const calculatedTotal = data.unit_price * data.quantity

    return {
        item_code: data.item_code,
        description: data.description,
        quantity: data.quantity,
        quantity_type: typeof data.quantity,
        unit_price: data.unit_price,
        unit_price_type: typeof data.unit_price,
        calculated_total: calculatedTotal,
        formatted_quantity: new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(data.quantity),
        formatted_unit_price: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(data.unit_price),
        formatted_total: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(calculatedTotal),
        raw_data: data
    }
}

/**
 * Get all BOQ items for a project with detailed calculation info
 */
export async function debugProjectBOQ(projectId: string) {
    const supabase = await createClient()

    const { data: items, error } = await supabase
        .from('rab_items')
        .select('*')
        .eq('project_id', projectId)
        .order('item_code')

    if (error) {
        console.error('Error fetching items:', error)
        return { error: error.message }
    }

    const debugInfo = items?.map(item => ({
        item_code: item.item_code,
        quantity: item.quantity,
        unit_price: item.unit_price,
        calculated_total: item.unit_price * item.quantity,
        formatted_total: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(item.unit_price * item.quantity)
    }))

    const grandTotal = items?.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0) || 0

    return {
        items: debugInfo,
        total_items: items?.length || 0,
        grand_total: grandTotal,
        formatted_grand_total: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(grandTotal)
    }
}
