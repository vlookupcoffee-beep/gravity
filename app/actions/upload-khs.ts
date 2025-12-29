'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function uploadKHS(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('file') as File
    const providerName = formData.get('providerName') as string

    if (!file || !providerName) {
        return { error: 'File and Provider Name are required' }
    }

    // 1. Create or Get Provider
    const { data: provider, error: providerError } = await supabase
        .from('khs_providers')
        .insert({ name: providerName })
        .select()
        .single()

    // Handle duplicate provider (optional: or just select existing)
    let providerId = provider?.id
    if (providerError) {
        // If error is unique constraint, fetch existing (simplistic approach)
        // For now, let's assume we want to create new or fail. 
        // Better: Try selecting if insert failed.
        const { data: existing } = await supabase
            .from('khs_providers')
            .select('id')
            .eq('name', providerName)
            .single()

        if (existing) providerId = existing.id
        else return { error: 'Failed to create provider or provider already exists.' }
    }

    // 2. Read and Parse CSV
    const text = await file.text()
    const lines = text.split('\n')

    const itemsToInsert = []

    // Skip header (index 0 and 1 based on the file view)
    // Line 1: NO;ITEM DESIGN;...
    // Line 2: ;;;;
    // Start from index 2

    const priceType = formData.get('priceType') as string || 'vendor'

    for (let i = 2; i < lines.length; i++) {
        const line = lines[i].trim()
        if (!line) continue

        // Split by semicolon
        const cols = line.split(';')
        if (cols.length < 5) continue

        // Columns: 0:NO, 1:ITEM DESIGN, 2:URAIAN DESIGN, 3:SATUAN, 4:HARGA (VENDOR/MANDOR)
        const itemCode = cols[1]?.trim()
        const description = cols[2]?.trim()
        const unit = cols[3]?.trim()
        const priceStr = cols[4]?.trim()
        const mandorPriceStr = cols[5]?.trim() // Potential 6th column

        if (!itemCode || !priceStr) continue

        // Clean values
        const priceVal = parseInt(priceStr.replace(/[^0-9]/g, ''))
        let mandorPriceVal = mandorPriceStr ? parseInt(mandorPriceStr.replace(/[^0-9]/g, '')) : 0

        if (isNaN(priceVal)) continue

        const item: any = {
            provider_id: providerId,
            item_code: itemCode,
            description: description,
            unit: unit
        }

        // Logic: 
        // If uploading as 'vendor', set 'price'. 
        // If uploading as 'mandor', set 'price_mandor'.
        // If 6th column exists, we can use it to set both if we want, but let's stick to the toggle for safety.
        if (priceType === 'mandor') {
            item.price_mandor = priceVal
        } else {
            item.price = priceVal
            if (!isNaN(mandorPriceVal) && mandorPriceVal > 0) {
                item.price_mandor = mandorPriceVal
            }
        }

        itemsToInsert.push(item)
    }

    if (itemsToInsert.length === 0) {
        return { error: 'No valid items found in CSV' }
    }

    // 3. Bulk Insert Items
    const { error: insertError } = await supabase
        .from('khs_items')
        .upsert(itemsToInsert, { onConflict: 'provider_id, item_code' })

    if (insertError) {
        console.error('Insert Error:', insertError)
        return { error: 'Failed to insert items into database.' }
    }

    revalidatePath('/dashboard/khs')
    return { success: true, count: itemsToInsert.length }
}

// Delete ALL KHS items from a provider (for re-upload)
export async function deleteAllKHSItems(providerId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('khs_items')
        .delete()
        .eq('provider_id', providerId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/khs')
    return { success: true }
}
